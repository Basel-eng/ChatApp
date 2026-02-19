import express from "express";
import { connectdb } from "./src/lib/db.js";
import dotenv from "dotenv";
import authRoute from "./src/controllers/auth.controller.js";
import messageRoute from "./src/controllers/message.controller.js";
import cookieParser from "cookie-parser";
import { server, app } from "./src/lib/socket.js";
import cors from "cors";

dotenv.config();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5175",
    credentials: true,
  }),
);
app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoute);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const port = process.env.PORT || 5000;
server.listen(port, () => console.log("server run succesfuly "), connectdb());
