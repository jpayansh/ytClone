import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (isValidObjectId(channelId)) {
    throw new ApiError(401, "Invalid channel Id");
  }

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized User");
  }

  const isSubscribed = await Subscription.findById({
    channel: channelId,
    subscriber: req.user?._id,
  });
  let response;
  try {
    response = isSubscribed
      ? await Subscription.deleteOne({ subscriber: req.user?._id })
      : await Subscription.create({
          subscriber: req.user?._id,
          channel: channelId,
        });
  } catch (error) {
    console.log("toggleSubscription error :: ", error);
    throw new ApiError(
      500,
      error.message ||
        "Something went wrong in the toggleSubscription subscriber aggregation pipeline"
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        response,
        isSubscribed === null
          ? "Subscribed successfully"
          : "Unsubscribed successfully"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(401, "Channel id is not valid");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const pipeline = [
    {
      $match: new mongoose.Types.ObjectId(channelId),
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
      $addFields: {
        subscriber: {
          $first: "$subscriber",
        },
      },
    },
  ];

  try {
    const subscribers = await Subscription.aggregate(pipeline);

    const subscriberList = subscribers.map((item) => item.subscriber);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscriberList,
          "Subscribers list fetched successfully"
        )
      );
  } catch (error) {
    console.log("getUserChannelSubscribers error :: ", error);
    throw new ApiError(
      500,
      error.message ||
        "Something went wrong in the getUserSubscribedChannels subscriber aggregation pipeline"
    );
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(401, "Invalid subscriber Id");
  }

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized user");
  }

  const channel = await User.findById(req.user?._id);
  if (!channel) {
    throw new ApiError(404, "Channel id not found");
  }

  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $pipeline: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedTo",
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
      $unwind: "$subscribedTo",
    },
    {
      $project: {
        subscribedChannel: "$subscribedTo",
      },
    },
  ];
  try {
    const channelSubscribedTo = await Subscription.aggregate(pipeline);
    const channelSubsByOwnerList = channelSubscribedTo.map(
      (item) => item.subscribedChannel
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelSubsByOwnerList,
          "Channels Subscribed By owner fetched successfully"
        )
      );
  } catch (error) {
    console.log("getSubscribedChannels error :: ", error);
    throw new ApiError(
      500,
      error?.message || "Internal server error in getSubscribedChannelByOwner"
    );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
