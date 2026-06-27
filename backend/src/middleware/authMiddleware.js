const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const BANNED_ACCOUNT_MESSAGE = "This account has been banned. Please contact an administrator.";

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authorization token is required");
  }

  // Extract token
  const token = authHeader.split(" ")[1];
  let decoded;

  try {
    decoded = verifyToken(token);
    console.log("Decoded JWT:", decoded);
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token");
  }

  const userId = decoded?.sub;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token payload");
  }

  // Fetch the full profile from database
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approvalStatus: true,
      accountStatus: true,
      approvalNotes: true,
      approvedAt: true,
      createdAt: true,
      updatedAt: true,
      walletBalance: true, // Retained wallet balance support cleanly

      // NGO Fields
      ngoOrganizationName: true,
      ngoRegistrationNumber: true,
      ngoContactPhone: true,
      ngoAddress: true,
      ngoDescription: true,
      ngoSsmDocumentUrl: true,
      ngoSsmDocumentPublicId: true,
      ngoSupportingDocUrls: true,
      ngoSupportingDocPublicIds: true,

      // Vendor Fields
      vendorBusinessName: true,
      vendorRegistrationNumber: true,
      vendorPlaceAddress: true,
      vendorContactPhone: true,
      vendorDescription: true,
      vendorSsmDocumentUrl: true,
      vendorSsmDocumentPublicId: true,

      // Rider Fields
      riderLicenseNumber: true,
      riderPhoneNumber: true,
      riderVehicleType: true,
      riderVehicleName: true,
      riderVehiclePlateNumber: true,
      riderVehicleColor: true,
      riderAddress: true,
      riderNotes: true,
      riderLicenseDocumentUrl: true,
      riderLicenseDocumentPublicId: true,
      riderVehicleGrantUrl: true,
      riderVehicleGrantPublicId: true,
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User associated with token no longer exists");
  }

  if (user.accountStatus === "BANNED") {
    throw new ApiError(StatusCodes.FORBIDDEN, BANNED_ACCOUNT_MESSAGE);
  }
  req.user = user;
  next();
});

module.exports = authMiddleware;
