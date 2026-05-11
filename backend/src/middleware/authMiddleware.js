const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authorization token is required");
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approvalStatus: true,
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
      approvalNotes: true,
      approvedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User associated with token no longer exists");
  }

  req.user = user;
  next();
});

module.exports = authMiddleware;
