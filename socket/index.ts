import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import createHttpError from "http-errors";
import { Types } from "mongoose";
import config from "../config/env";
import { verifyJwt } from "../utils/jwt";
import { UserModel, UserDocument } from "../models/User";
import { ParentChildLinkModel } from "../models/ParentChildLink";
import { saveLocationPing } from "../services/locationService";
import { z } from "zod";

const locationSchema = z.object({
  userId: z.string().length(24),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  ts: z.string().datetime(),
});

type SafeSocket = Socket & {
  data: {
    user: UserDocument;
    subscriptions?: Set<string>;
  };
};

const childRoom = (childId: string) => `child:${childId}`;

const extractTokenFromCookie = (cookieHeader?: string) => {
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${config.cookieName}=`)) {
      return cookie.split("=")[1];
    }
  }
  return undefined;
};

const authenticateSocket = async (socket: Socket) => {
  const token =
    (socket.handshake.auth as Record<string, string | undefined>)?.token ||
    socket.handshake.headers.authorization?.replace("Bearer ", "") ||
    extractTokenFromCookie(socket.handshake.headers.cookie);

  if (!token) {
    throw createHttpError(401, "Socket authentication failed");
  }

  const payload = verifyJwt(token);
  const user = await UserModel.findById(payload.sub);
  if (!user) {
    throw createHttpError(401, "User not found");
  }

  (socket as SafeSocket).data.user = user;
};

const handleChildSocket = (socket: SafeSocket, io: SocketIOServer) => {
  const childId = socket.data.user._id.toString();
  socket.join(childRoom(childId));

  socket.on("location:update", async (rawPayload, ack?: (response: unknown) => void) => {
    try {
      const payload = locationSchema.parse(rawPayload);
      if (payload.userId !== childId) {
        throw createHttpError(403, "User mismatch");
      }

      const mongoId = new Types.ObjectId(payload.userId);

      const childUser = await UserModel.findById(mongoId);
      if (!childUser?.consentGiven) {
        throw createHttpError(403, "Consent required before sending location");
      }
      await saveLocationPing({
        userId: mongoId,
        lat: payload.lat,
        lng: payload.lng,
        accuracy: payload.accuracy,
        speed: payload.speed,
        heading: payload.heading,
        ts: new Date(payload.ts),
      });

      io.to(childRoom(childId)).emit("location:push", payload);
      ack?.({ ok: true });
    } catch (error) {
      console.error("Failed to process location payload", error);
      ack?.({ error: (error as Error).message });
    }
  });
};

const handleParentSocket = (socket: SafeSocket) => {
  socket.data.subscriptions = new Set();

  socket.on("parent:subscribe", async ({ childId }: { childId: string }, ack?: (response: unknown) => void) => {
    try {
      const link = await ParentChildLinkModel.findOne({
        parentId: socket.data.user._id,
        childId,
        status: "ACCEPTED",
      });

      if (!link) {
        throw createHttpError(403, "Not linked to child");
      }

      socket.join(childRoom(childId));
      socket.data.subscriptions?.add(childId);
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ error: (error as Error).message });
    }
  });

  socket.on("disconnect", () => {
    socket.data.subscriptions?.clear();
  });
};

export const initSocket = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      await authenticateSocket(socket);
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  io.on("connection", (socket: SafeSocket) => {
    const user = socket.data.user;
    if (user.role === "child") {
      handleChildSocket(socket, io);
    } else if (user.role === "parent") {
      handleParentSocket(socket);
    }
  });

  return io;
};


