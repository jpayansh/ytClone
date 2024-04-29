import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyJWT);
router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router;
