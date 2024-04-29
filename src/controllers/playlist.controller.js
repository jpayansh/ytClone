import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
  if (name?.trim() === "" || description?.trim() === "") {
    throw new ApiError(400, "name and description is required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  if (!playlist) {
    throw new ApiError(500, "Playlist has been not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const playlist = await Playlist.findById({ owner: userId });
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const playlistAggregate = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "users",
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
              videoOwner: {
                $first: "$owner",
              },
            },
          },
          {
            $unset: "owner",
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
      $unwind: "$videos",
    },
  ]);
  if (!playlistAggregate) throw new ApiError(404, "Playlist not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistAggregate, "Playlist fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const playlistAggregate = await Playlist.aggregate([
    {
      $match: new mongoose.Types.ObjectId(playlistId),
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
                    username: 1,
                    fullName: 1,
                    avatar: avatar.url,
                    _id: 1,
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
            $unset: "owner",
          },
          {
            $addFields: {
              videoFile: "$videoFile",
            },
          },
          {
            $addFields: {
              thumbnail: "$thumbnail",
            },
          },
        ],
      },
    },
  ]);
  if (!playlistAggregate) {
    throw new ApiError(
      500,
      "Something went wrong at the time of fetching playlist"
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistAggregate, "Playlist fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );
  if (!updatedPlaylist) throw new ApiError(500, "playlist not updated");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const removeVideoPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { video: videoId } },
    { new: true }
  );

  if (!removeVideoPlaylist) {
    throw new ApiError(500, "playlist not updated");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        removeVideoPlaylist,
        "Videos has been removed successfully from playlist"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist) {
    throw new ApiError(500, "Playlist not deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (name?.trim() !== "" || description?.trim() !== "") {
    throw new ApiError(400, "Name and Description are required");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatePlaylist) {
    throw new ApiError(500, "playlist not updated");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatePlaylist,
        "Playlist has been updated successfully"
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
