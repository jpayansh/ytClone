import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import

import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./controllers/healthcheck.controller.js";
import likeRouter from "./controllers/likeRouter.controller.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./controllers/tweetRouter.controller.js";
import playlistRouter from "./routes/playlist.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import videoRouter from "./routes/video.routes.js";

//routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/videos", videoRouter);
export { app };
