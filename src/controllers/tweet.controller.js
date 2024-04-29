import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const { content } = req.body;
  if (!content?.trim() === "") {
    throw new ApiError(404, "Content is required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });
  if (!tweet) {
    throw new ApiError(500, "Something went wrong while creating tweet");
  }

  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets

  const { userId } = req.parems;
  if (!isValidObjectId(userId)) {
    throw new ApiError(404, "Invalid user id");
  }
  if (!userId) {
    throw new ApiError(404, "User id is required");
  }

  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweetAggregate = await Tweet.aggregate([
    {
      $match: new mongoose.Types.ObjectId(user?._id),
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              avatar: "$avatar.url",
              fullName: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
  if (!tweetAggregate) {
    throw new ApiError(404, "Tweet not found");
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customLabels: {
      totalDocs: "totalTweets",
      docs: "tweets",
    },
    $skip: (page - 1) * limit,
  };

  Tweet.aggregatePaginate(tweetAggregate, options)
    .then((result) => {
      if (result.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "No tweets found"));
      }
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Tweets fetched successfully"));
    })
    .catch((error) => {
      console.error("Error in aggregation:", error);
      throw new ApiError(
        500,
        error?.message || "Internal server error in tweet aggregation"
      );
    });
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.parems;
  const { content } = req.body;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(404, "Invalid tweetId");
  }
  if (!tweetId) {
    throw new ApiError(404, "Tweet id not found");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!content?.trim() === "") {
    throw new ApiError(404, "content is required");
  }
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );
  if (!updatedTweet) {
    return new ApiError(500, "Something went wrong during updating the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.parems;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(404, "Invalid tweetId");
  }
  if (!tweetId) {
    throw new ApiError(404, "Tweet id not found");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet)
    throw new ApiError(500, "Something went wrong while deleting tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
