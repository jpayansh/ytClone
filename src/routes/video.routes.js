import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);
router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      { name: "videoField", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
  );
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
router
  .route("/:videoId")
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo)
  .get(getVideoById);
export default router;
