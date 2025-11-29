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

  console.log(`[Socket] Child connected: ${childId} (${socket.data.user.name})`);

  socket.on("location:update", async (rawPayload, ack?: (response: unknown) => void) => {
    try {
      console.log(`[Socket] Location update received from child ${childId}`, {
        rawPayload,
        timestamp: new Date().toISOString()
      });

      const payload = locationSchema.parse(rawPayload);
      
      if (payload.userId !== childId) {
        console.warn(`[Socket] User mismatch: expected ${childId}, got ${payload.userId}`);
        throw createHttpError(403, "User mismatch");
      }

      const mongoId = new Types.ObjectId(payload.userId);

      const childUser = await UserModel.findById(mongoId);
      if (!childUser) {
        console.error(`[Socket] Child user not found: ${payload.userId}`);
        throw createHttpError(404, "Child user not found");
      }

      if (!childUser.consentGiven) {
        console.warn(`[Socket] Consent not given for child ${childId}`);
        throw createHttpError(403, "Consent required before sending location");
      }

      console.log(`[Socket] Saving location ping for child ${childId}`, {
        lat: payload.lat,
        lng: payload.lng,
        accuracy: payload.accuracy,
        ts: payload.ts
      });

      await saveLocationPing({
        userId: mongoId,
        lat: payload.lat,
        lng: payload.lng,
        accuracy: payload.accuracy,
        speed: payload.speed,
        heading: payload.heading,
        ts: new Date(payload.ts),
      });

      console.log(`[Socket] Location ping saved successfully for child ${childId}`);

      io.to(childRoom(childId)).emit("location:push", payload);
      ack?.({ ok: true, message: "Location saved successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Socket] Failed to process location payload for child ${childId}:`, {
        error: errorMessage,
        rawPayload,
        stack: error instanceof Error ? error.stack : undefined
      });
      ack?.({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      });
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


