const { Prisma } = require("@prisma/client");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/apiError");

const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Uploaded file is too large. Maximum file size is 5 MB.";
    } else {
      message = err.message;
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      message = "A record with this value already exists";
      details = err.meta;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    message = "Invalid database query";
  }

  if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
    details = envSafe(req.app?.get("env")) === "development" ? details || err.stack : null;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {})
  });
};

const envSafe = (appEnv) => appEnv || process.env.NODE_ENV || "development";

module.exports = {
  notFoundMiddleware,
  errorMiddleware
};
