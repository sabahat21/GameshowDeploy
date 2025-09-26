import express, { json } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";

export const setupServer = () => {
  const app = express();
  const server = createServer(app);
  const corsOptions = {
    origin: "https://gameshow-deploy.vercel.app",
    methods: ["GET", "POST"],
    credentials: true, // <- optional but useful
  };
  const io = new Server(server, {
    cors: corsOptions,
  });

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(json());

  return { app, server, io };
};
