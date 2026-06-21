const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

<<<<<<< HEAD
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authorization token is required");
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
=======
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
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approvalStatus: true,
<<<<<<< HEAD
=======
      approvalNotes: true,
      approvedAt: true,
      createdAt: true,
      updatedAt: true,

>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
      ngoOrganizationName: true,
      ngoRegistrationNumber: true,
      ngoContactPhone: true,
      ngoAddress: true,
      ngoDescription: true,
      ngoSsmDocumentUrl: true,
      ngoSsmDocumentPublicId: true,
      ngoSupportingDocUrls: true,
      ngoSupportingDocPublicIds: true,
<<<<<<< HEAD
=======

>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
      vendorBusinessName: true,
      vendorRegistrationNumber: true,
      vendorPlaceAddress: true,
      vendorContactPhone: true,
      vendorDescription: true,
      vendorSsmDocumentUrl: true,
      vendorSsmDocumentPublicId: true,
<<<<<<< HEAD
=======

>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
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
<<<<<<< HEAD
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
=======
      walletBalance: true,
    },
  });

  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "User associated with token no longer exists",
    });
  }

  req.user = user;

>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
  next();
});

module.exports = authMiddleware;
