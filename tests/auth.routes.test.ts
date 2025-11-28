import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../app";
import config from "../config/env";

describe("auth routes", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "test" });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("signs up and logs in a user", async () => {
    const csrfResp = await request(app).get("/auth/csrf");
    const csrfToken = csrfResp.body.csrfToken;
    const cookies = csrfResp.headers["set-cookie"] ?? [];
    const csrfCookieHeader = [...cookies].reverse().find((cookie: string) =>
      cookie.startsWith(`${config.csrfCookieName}`),
    );
    const csrfCookie = csrfCookieHeader?.split(";")[0];

    expect(csrfToken).toBeDefined();
    expect(csrfCookie).toBeDefined();

    const signup = await request(app)
      .post("/auth/signup")
      .set("Cookie", csrfCookie as string)
      .set(config.csrfHeaderName, csrfToken)
      .send({
        name: "Test Parent",
        email: "parent@example.com",
        password: "Supersafe1!",
        role: "parent",
      });

    expect(signup.status).toBe(201);
    expect(signup.body.user.email).toBe("parent@example.com");

    const login = await request(app)
      .post("/auth/login")
      .set("Cookie", csrfCookie as string)
      .set(config.csrfHeaderName, csrfToken)
      .send({
        email: "parent@example.com",
        password: "Supersafe1!",
      })
      .expect(200);

    expect(login.body.user.role).toBe("parent");
  });
});


