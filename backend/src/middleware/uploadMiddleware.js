const multer = require("multer");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/apiError");

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        "Only PDF, JPG, PNG, and WEBP files are allowed for NGO verification documents"
      )
    );
  }

  cb(null, true);
};

<<<<<<< HEAD
=======
const imageFileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        "Only JPG, PNG, and WEBP image files are allowed for listing images"
      )
    );
  }

  cb(null, true);
};

>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
const uploadNgoDocuments = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}).fields([
  { name: "ssmDocument", maxCount: 1 },
  { name: "supportingDocuments", maxCount: 3 },
  { name: "vendorSsmDocument", maxCount: 1 },
  { name: "riderLicenseDocument", maxCount: 1 },
  { name: "riderVehicleGrantDocument", maxCount: 1 }
]);

<<<<<<< HEAD
module.exports = {
  uploadNgoDocuments
=======
const uploadListingImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}).single("listingImage");

module.exports = {
  uploadNgoDocuments,
  uploadListingImage
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
};
