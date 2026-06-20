const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Authorization token is required"
    );
  }

  // Extract token
  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = verifyToken(token);

    console.log("Decoded JWT:", decoded);
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Invalid or expired token",
    });
  }

  const userId = decoded.sub;

  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Invalid token payload",
    });
  }

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
      approvalNotes: true,
      approvedAt: true,
      createdAt: true,
      updatedAt: true,

      ngoOrganizationName: true,
      ngoRegistrationNumber: true,
      ngoContactPhone: true,
      ngoAddress: true,
      ngoDescription: true,
      ngoSsmDocumentUrl: true,
      ngoSsmDocumentPublicId: true,
      ngoSupportingDocUrls: true,
      ngoSupportingDocPublicIds: true,

      vendorBusinessName: true,
      vendorRegistrationNumber: true,
      vendorPlaceAddress: true,
      vendorContactPhone: true,
      vendorDescription: true,
      vendorSsmDocumentUrl: true,
      vendorSsmDocumentPublicId: true,

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
      walletBalance: true,
    },
  });

  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "User associated with token no longer exists",
    });
  }

  req.user = user;

  next();
});

module.exports = authMiddleware;
