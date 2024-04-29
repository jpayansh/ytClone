import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("no file path provided!");
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded successfully
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved file as the upload operation got failed
    console.log(`Error uploading file to Cloudinary :: ${error}`);
    return null;
  }
};

const deleteOnCloudinary = async (oldImageUrl, publicId) => {
  try {
    if (!(oldImageUrl || publicId))
      throw new ApiError(404, "oldImageUrl or publicId required");
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: `${oldImageUrl.includes("image") ? "image" : "video"}`,
    });
    console.log("Assests deleted from cloudinary", result);
  } catch (error) {
    console.error("Error deleting assest from Cloudinary", error);
    throw new ApiError(500, error?.message || "Server error");
  }
};
export { uploadOnCloudinary, deleteOnCloudinary };
