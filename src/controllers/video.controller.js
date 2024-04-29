import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = 1,
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.findById({ owner: userId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const pipeline = [
    {
      $match: {
        $or: [
          {
            title: { $regex: query, $options: "i" },
          },
          {
            description: { $regex: query, $options: "i" },
          },
        ],
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $pipeline: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: avatar.url,
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
        [sortBy || "createdBy"]: sortType || 1,
      },
    },
  ];
  let videoAggregate;

  try {
    videoAggregate = await Video.aggregate(pipeline);
  } catch (error) {
    console.log("Error in getAllVideos aggregation :: ", error);
    throw new ApiError(
      500,
      "Something went wrong with the getAllVideos aggregation"
    );
  }

  const options = {
    page,
    limit,
    customLabels: {
      totalDocs: "totalVideos",
      docs: "Videos",
    },
    $skip: (page - 1) * limit,
    limit: parseInt(limit),
  };
  Video.aggregatePaginate(videoAggregate, options)
    .then((result) => {
      if (result?.video?.length === 0 && userId) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "No Videos found"));
      }
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Videos fetched successfully"));
    })
    .catch((error) => {
      console.log("error :: ", error);
      throw new ApiError(
        500,
        error?.message || "Internal server error in video aggregate Paginate"
      );
    });
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  let videoFile, thumbnail;

  try {
    if ([title, description].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "Please provide title and description");
    }
    if (!req.files?.videoFile?.[0]?.path || !req.files?.thumbnail?.[0]?.path) {
      throw new ApiError(404, "Please provide valid video and thumbnail");
    }
    videoFile = await uploadOnCloudinary(req.files?.videoFile[0]?.path);
    thumbnail = await uploadOnCloudinary(req.files?.thumbnail[0]?.path);

    if (!videoFile || !thumbnail) {
      throw new ApiError(
        500,
        "Something went wrong at the time of uploading vdFile or thumbFile on cloudinary"
      );
    }

    const video = await Video.create({
      videoFile: { publicId: videoFile?.public_id, url: videoFile?.url },
      thumbnail: { publicId: thumbnail?.public_id, url: thumbnail?.url },
      title,
      description,
      duration: videoFile?.duration,

      owner: req.user?._id,
    });

    if (!video) {
      throw new ApiError(
        500,
        "Something went wrong in creating video in publishVideo"
      );
    }
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...video._doc,
          videoFile: videoFile?.url,
          thumbnail: thumbnail?.url,
        },
        "Video Published Successfully"
      )
    );
  } catch (error) {
    try {
      if (videoFile?.url)
        await deleteOnCloudinary(videoFile?.url, videoFile?.public_id);
      if (thumbnail?.url)
        await deleteOnCloudinary(thumbnail?.url, thumbnail?.public_id);
    } catch (error) {
      console.error("Error while deleting video :: ", error);
      throw new ApiError(
        500,
        error?.message || "Server error while deleting video from cloudinary"
      );
    }
    console.error("Error while publishing the video :: ", error);
    throw new ApiError(
      500,
      error?.message || "Server error while uploading video"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Video id is not valid");
  }

  const findVideo = await Video.findById(videoId);
  if (!findVideo) {
    throw new ApiError(404, "Video not found");
  }

  const user = await User.findById(req.user?._id, { watchHistory: 1 });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user?.watchHistory.includes(videoId)) {
    await Video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    );
  }
  await User.findByIdAndUpdate(
    req.user?._id,
    { $addToSet: { watchHistory: videoId } },
    { new: true }
  );

  const video = await Video.aggregate([
    {
      $match: new mongoose.Types.ObjectId(videoId),
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
              username: 1,
              fullName: 1,
              avatar: avatar.url,
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
        videoFile: "$videoFile.url",
        thumbnail: "$thumbnail.url",
      },
    },
  ]);
  if (!video) throw new ApiError(500, "Video details does not found");
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Fetched video successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { description, title } = req.body;

  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  if ([description, title].some((field) => field.trim() === "")) {
    throw new ApiError(400, "update fields are required");
  }
  if (!req.file?.path) {
    throw new ApiError(400, "Plase provide valid thumbnail video");
  }

  const thumbnailLocalPath = req.file?.path;
  const oldVideo = await Video.findById(videoId);
  const user = await User.findById(req.user?._id);

  if (!oldVideo) {
    throw new ApiError(404, "No Video found");
  }
  if (!user) {
    throw new ApiError(404, "No User found");
  }

  const updatedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!updatedThumbnail) {
    throw new ApiError(
      500,
      "Something went wrong at the time of uploading the thumbnail on cloudinary"
    );
  }

  const { publicId, url } = oldVideo?.thumbnail;
  if (!(publicId || url)) {
    throw new ApiError(500, "old thumbnail url or publicId not found");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        description,
        title,
        thumbnail: {
          url: updatedThumbnail?.url,
          public_id: updatedThumbnail?.public_id,
        },
      },
    },
    { new: true }
  );

  if (!video) {
    await deleteOnCloudinary(
      updatedThumbnail?.url,
      updatedThumbnail?.public_id
    );
    console.error("Video not updated successfully", error);
    throw new ApiError(500, "updated video not uploaded on database");
  }
  if (url) {
    try {
      await deleteOnCloudinary(
        updatedThumbnail?.url,
        updatedThumbnail?.public_id
      );
    } catch (error) {
      console.log(
        `Failed to Delete Old thumbnail From Cloudinary Server ${error}`
      );
      throw new ApiError(500, error?.message || "Server Error");
    }
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  let deleteVideoFilePromise, deleteThumbnailFilePromise;
  try {
    // 1. Validate videoId and fetch video details (optimized query)
    const video = await Video.findById(videoId, {
      videoFile: 1,
      thumbnail: 1,
    }).select("_id videoFile thumbnail"); // Use aggregation pipeline for efficiency

    if (!video) throw new ApiError(404, "No Video Found");

    // 2. Delete video file and thumbnail from Cloudinary (concurrent calls)
    [deleteVideoFilePromise, deleteThumbnailFilePromise] = await Promise.all([
      deleteOnCloudinary(video.videoFile.url, video.videoFile.publicId),
      deleteOnCloudinary(video.thumbnail.url, video.thumbnail.publicId),
    ]);

    // 3. Delete video from database
    await Video.findByIdAndDelete(videoId);

    // 4. Remove video from related collections (optimized updates)
    await Promise.all([
      User.updateMany({ watchHistory: videoId }, { $pull: videoId }),
      Comment.deleteMany({ video: videoId }),
      Playlist.updateMany({ videos: videoId }, { $pull: videoId }),
      Like.deleteMany({ video: videoId }),
    ]);

    return res
      .status(200)
      .json(new ApiResponse(201, {}, "Video has been deleted Successfully"));
  } catch (error) {
    console.error("Error while deleting Video :: ", error);
    throw new ApiError(
      500,
      error.message || "Server Error while deleting video"
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "No video found");

  if (video?.owner?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(400, "Unauthorized Request");
  }

  const toggleVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true }
  );

  if (!toggleVideo) {
    throw new ApiError(500, "Something went wrong while updating the video");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toggleVideo,
        toggleVideo?.isPublished
          ? "Video publish successfully"
          : "Video unpublish successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
