import mongoose, { isValidObjectId, Schema } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "invalid Video Id");
  }

  const video = await Video.findById(videoId, { _id: 1 });
  if (!video) throw new ApiError(401, "Video not found");

  var commentAggregate;
  try {
    commentAggregate = await Comment.aggregate([
      // stage 1 : getting all comments of a video using videoId
      {
        $match: { video: new mongoose.Types.ObjectId(videoId) },
      },
      // stage 2 getting user info form users collection
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "owner",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 1,
                avatar: "$avatar.url",
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
    ]);
  } catch (error) {
    console.error("Error in aggregation:", error);
    throw new ApiError(
      500,
      error.message || "Internal server error in comment aggregation"
    );
  }

  const options = {
    page,
    limit,
    customLabel: {
      docs: "comments",
      totalDocs: "totalComments",
    },
    limit: parseInt(limit),
  };
  Comment.aggregatePaginate(commentAggregate, options)
    .then((result) => {
      if (result.comments?.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "No comments found"));
      }
      return res.status(200).json(new ApiResponse(200, result, "Success"));
    })
    .catch((error) => {
      console.log("Error in aggregation: ", error);
      return res
        .status(500)
        .json(new ApiError(500, error.message || "Internal server error"));
    });
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { content } = req.body;
  const { videoId } = req.parems;
  if (!content?.trim() == "") {
    throw new ApiError(400, "Comment is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid Video Id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong while adding comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Successfully added comment"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(404, "invalid Comment Id");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const { content } = req.body;
  if (!content?.trim() === "") {
    throw new ApiError(404, "Content is required");
  }

  comment.content = content;
  const updatedComment = await comment.save({
    validateBeforeSave: false,
    new: true,
  });
  if (!updateComment) {
    throw new ApiError(500, "Something went wrong while updating the comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(404, "invalid Comment Id");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Not found comment for this Id");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId, {
    new: true,
  });
  if (!deleteComment) {
    throw new ApiError(500, "Something went wrong while deleting comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
