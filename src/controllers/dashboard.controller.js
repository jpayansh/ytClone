import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const channelStats = [];
  if (!req.user?._id) {
    throw new ApiError(404, "Unauthorized request");
  }

  //total video views and total video

  // const views = await Video.aggregate([
  //   {
  //     $match: {
  //       owner: new mongoose.Types.ObjectId(req.user._id),
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: null,
  //       totalViews: {
  //         $sum: "$views",
  //       },
  //       totalVideo: {
  //         $sum: 1,
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //     },
  //   },
  // ]);

  // if (!views?.length) {
  //   throw new ApiError(500, "Something went wrong in the views pipeline");
  // }
  // channelStats["totalViews"] = views[0].totalViews;
  // channelStats["totalVideo"] = views[0].totalVideo;

  const video = await Video.findById({ owner: req.user._id });
  channelStats.push({ totalVideos: video.length });

  const totalViews = video.reduce((acc, curr) => {
    return acc + curr.views;
  }, 0);
  channelStats.push({ views: totalViews });

  // total subscribers
  const userSubscription = await Subscription.find({ channel: req.user._id });
  const totalSubscription = userSubscription.length;
  channelStats.push({ subscribers: totalSubscription });

  // total Channel Subscribed by channel owner
  const channelSubscription = await Subscription.find({
    subscriber: req.user._id,
  });
  const totalSubscriptionChannel = channelSubscription.length;
  channelStats.push({ subscribedTo: totalSubscriptionChannel });

  //total tweet
  const tweets = await Tweet.find({ owner: req.user._id });
  const totalTweets = tweets.length;
  channelStats.push(totalTweets);

  //total likes
  let sum = 0;
  for (let videoId of video) {
    const likeDoc = await Like.find({ video: videoId });
    if (likeDoc?.length > 0) {
      sum += likeDoc.length;
    }
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "Channel stats fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  if (!req.user?._id) {
    throw new ApiError(404, "Unauthorized request");
  }

  try {
    const videos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                fullName: 1,
                username: 1,
                avatar: "$avatar.url",
              },
            },
          ],
        },
      },
      {
        $unwind: "$user",
      },
    ]);
    return res
      .staus(200)
      .json(new ApiResponse(200, videos, "All Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message ||
        "Something went wrong with the getting all the videos aggregation pipeline"
    );
  }
});

export { getChannelStats, getChannelVideos };
