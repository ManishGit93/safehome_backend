import http from "http";
import config from "./config/env";
import { connectToDatabase } from "./db/connection";
import { app } from "./app";
import { initSocket } from "./socket";

const start = async () => {
  try {
    await connectToDatabase();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(config.port, () => {
      console.log(`🚀 SafeHome backend listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void start();


