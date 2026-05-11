const { Readable } = require("stream");
const { v2: cloudinary } = require("cloudinary");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/apiError");

const getCloudinaryCredentials = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  };
};

const getCloudinaryClient = () => {
  cloudinary.config(getCloudinaryCredentials());
  return cloudinary;
};

const uploadBufferToCloudinary = (file, options = {}) =>
  new Promise((resolve, reject) => {
    const client = getCloudinaryClient();

    const uploadStream = client.uploader.upload_stream(
      {
        folder: "feedback/ngo-documents",
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type
        });
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });

const deleteCloudinaryAsset = async (publicId, resourceType = "image") => {
  const client = getCloudinaryClient();

  await client.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true
  });
};

module.exports = {
  uploadBufferToCloudinary,
  deleteCloudinaryAsset
};
