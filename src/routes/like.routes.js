import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
} from "../controllers/like.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyJWT);
router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/c/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router;
