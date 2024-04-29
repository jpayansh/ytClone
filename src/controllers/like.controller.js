import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toogleLike = async (Model, resourceId, userId) => {
  if (!isValidObjectId(resourceId)) {
    throw new ApiError(400, "Invalid Resource id");
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User id");
  }

  const resource = await Model.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, "No resources Found");
  }

  const resourceField = Model.modelName.toLowerCase();
  const isLiked = await Like.findById({
    [resourceField]: resourceId,
    likedBy: userId,
  });
  var response;
  try {
    response = isLiked
      ? await Like.deleteOne({ [resourceField]: resourceId, likedBy: userId })
      : await Like.create({ [resourceField]: resourceId, likedBy: userId });
  } catch (error) {
    console.log("togglelike error :: ", error);
    throw new ApiError(
      500,
      error?.message || "Internet server error in toggleLike"
    );
  }
  const totalLikes = await Like.countDocuments({ [resourceField]: resourceId });
  return { response, isLiked, totalLikes };
};

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const { response, isLiked, totalLikes } = toogleLike(
    Video,
    videoId,
    req.user?._id
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { response, totalLikes },
        isLiked === null ? "Liked successfully" : "remove liked successfully"
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  const { response, isLiked, totalLikes } = toogleLike(
    Comment,
    commentId,
    req.user?._id
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { response, totalLikes },
        isLiked === null ? "Liked successfully" : "remove liked successfully"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  const { response, isLiked, totalLikes } = toogleLike(
    Tweet,
    tweetId,
    req.user?._id
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { response, totalLikes },
        isLiked === null ? "Liked successfully" : "remove liked successfully"
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const videoPipeline = [
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
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
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $addFields: {
              videoFile: "$videoFile.url",
            },
          },
          {
            $addFields: {
              thumbnail: "$thumbnail.url",
            },
          },
        ],
      },
    },

    {
      $unwind: "$video",
    },

    {
      $replaceRoot: {
        newRoot: "$video",
      },
    },
  ];
  try {
    const likedVideos = await Like.aggregate(videoPipeline);
    return res
      .status(200)
      .json(
        new ApiResponse(200, likedVideos, "liked videos fetched successfully")
      );
  } catch (error) {
    console.log("getLikedVideos error :: ", error);
    throw new ApiError(
      500,
      error?.message || "Internal server error in getLikedVideos"
    );
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
