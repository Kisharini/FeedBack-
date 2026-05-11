const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { deleteCloudinaryAsset, uploadBufferToCloudinary } = require("../config/cloudinary");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/jwt");
const pickUserResponse = require("../utils/pickUserResponse");

const SALT_ROUNDS = 10;
const APPROVAL_REQUIRED_ROLES = new Set(["NGO", "RIDER"]);

const buildAuthResponse = (user) => ({
  user: pickUserResponse(user),
  token: generateToken({
    sub: user.id,
    role: user.role,
    email: user.email
  })
});

const uploadSingleAsset = async (file, folder) => {
  if (!file) {
    return {
      url: null,
      publicId: null
    };
  }

  return uploadBufferToCloudinary(file, { folder });
};

const cleanupUploadedAssets = async (assets) => {
  await Promise.allSettled(
    assets
      .filter(Boolean)
      .map((asset) => deleteCloudinaryAsset(asset.publicId, asset.resourceType))
  );
};

const uploadNgoDocumentsToCloudinary = async (files) => {
  const uploadedAssets = [];

  try {
    const ssmUpload = await uploadSingleAsset(
      files?.ssmDocument?.[0],
      "feedback/ngo-documents/ssm"
    );

    if (ssmUpload.publicId) {
      uploadedAssets.push(ssmUpload);
    }

    const supportingUploads = [];

    for (const file of files?.supportingDocuments || []) {
      const upload = await uploadBufferToCloudinary(file, {
        folder: "feedback/ngo-documents/supporting"
      });
      uploadedAssets.push(upload);
      supportingUploads.push(upload);
    }

    return {
      ngoSsmDocumentUrl: ssmUpload.url,
      ngoSsmDocumentPublicId: ssmUpload.publicId,
      ngoSupportingDocUrls: supportingUploads.map((upload) => upload.url),
      ngoSupportingDocPublicIds: supportingUploads.map((upload) => upload.publicId)
    };
  } catch (error) {
    await cleanupUploadedAssets(uploadedAssets);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to upload NGO documents to Cloudinary",
      error.message
    );
  }
};

const uploadVendorDocumentsToCloudinary = async (files) => {
  const uploadedAssets = [];

  try {
    const ssmUpload = await uploadSingleAsset(
      files?.vendorSsmDocument?.[0],
      "feedback/vendor-documents/ssm"
    );

    if (ssmUpload.publicId) {
      uploadedAssets.push(ssmUpload);
    }

    return {
      vendorSsmDocumentUrl: ssmUpload.url,
      vendorSsmDocumentPublicId: ssmUpload.publicId
    };
  } catch (error) {
    await cleanupUploadedAssets(uploadedAssets);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to upload vendor documents to Cloudinary",
      error.message
    );
  }
};

const uploadRiderDocumentsToCloudinary = async (files) => {
  const uploadedAssets = [];

  try {
    const licenseUpload = await uploadSingleAsset(
      files?.riderLicenseDocument?.[0],
      "feedback/rider-documents/license"
    );
    const grantUpload = await uploadSingleAsset(
      files?.riderVehicleGrantDocument?.[0],
      "feedback/rider-documents/grant"
    );

    if (licenseUpload.publicId) {
      uploadedAssets.push(licenseUpload);
    }

    if (grantUpload.publicId) {
      uploadedAssets.push(grantUpload);
    }

    return {
      riderLicenseDocumentUrl: licenseUpload.url,
      riderLicenseDocumentPublicId: licenseUpload.publicId,
      riderVehicleGrantUrl: grantUpload.url,
      riderVehicleGrantPublicId: grantUpload.publicId
    };
  } catch (error) {
    await cleanupUploadedAssets(uploadedAssets);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to upload rider documents to Cloudinary",
      error.message
    );
  }
};

const getRoleSpecificData = async (body, files) => {
  if (body.role === "NGO") {
    if (!files?.ssmDocument?.[0]) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "NGO registration requires an SSM document upload"
      );
    }

    const documents = await uploadNgoDocumentsToCloudinary(files);

    return {
      ngoOrganizationName: body.ngoOrganizationName,
      ngoRegistrationNumber: body.ngoRegistrationNumber,
      ngoContactPhone: body.ngoContactPhone,
      ngoAddress: body.ngoAddress,
      ngoDescription: body.ngoDescription,
      ...documents
    };
  }

  if (body.role === "VENDOR") {
    if (!files?.vendorSsmDocument?.[0]) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Vendor registration requires an SSM document upload"
      );
    }

    const documents = await uploadVendorDocumentsToCloudinary(files);

    return {
      vendorBusinessName: body.vendorBusinessName,
      vendorRegistrationNumber: body.vendorRegistrationNumber,
      vendorPlaceAddress: body.vendorPlaceAddress,
      vendorContactPhone: body.vendorContactPhone,
      vendorDescription: body.vendorDescription || null,
      ...documents
    };
  }

  if (body.role === "RIDER") {
    if (!files?.riderLicenseDocument?.[0]) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Rider registration requires a driving license upload"
      );
    }

    if (!files?.riderVehicleGrantDocument?.[0]) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Rider registration requires a vehicle grant upload"
      );
    }

    const documents = await uploadRiderDocumentsToCloudinary(files);

    return {
      riderLicenseNumber: body.riderLicenseNumber,
      riderPhoneNumber: body.riderPhoneNumber,
      riderVehicleType: body.riderVehicleType,
      riderVehicleName: body.riderVehicleName,
      riderVehiclePlateNumber: body.riderVehiclePlateNumber,
      riderVehicleColor: body.riderVehicleColor || null,
      riderAddress: body.riderAddress,
      riderNotes: body.riderNotes || null,
      ...documents
    };
  }

  return {};
};

const getPendingApprovalMessage = (role) => {
  if (role === "NGO") {
    return "NGO registration submitted successfully and is pending admin approval";
  }

  if (role === "RIDER") {
    return "Rider registration submitted successfully and is pending admin approval";
  }

  return "User registered successfully";
};

const register = asyncHandler(async (req, res) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: req.validated.body.email }
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(req.validated.body.password, SALT_ROUNDS);
  const approvalRequired = APPROVAL_REQUIRED_ROLES.has(req.validated.body.role);
  const roleSpecificData = await getRoleSpecificData(req.validated.body, req.files);

  const user = await prisma.user.create({
    data: {
      name: req.validated.body.name,
      email: req.validated.body.email,
      password: hashedPassword,
      role: req.validated.body.role,
      approvalStatus: approvalRequired ? "PENDING" : "APPROVED",
      ...roleSpecificData
    }
  });

  const result = approvalRequired ? { user: pickUserResponse(user) } : buildAuthResponse(user);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: getPendingApprovalMessage(req.validated.body.role),
    data: result
  });
});

const getPendingLoginMessage = (role, status) => {
  if (status === "REJECTED") {
    if (role === "NGO") {
      return "Your NGO registration has been rejected. Please contact an administrator.";
    }

    if (role === "RIDER") {
      return "Your rider registration has been rejected. Please contact an administrator.";
    }
  }

  if (role === "NGO") {
    return "Your NGO registration is pending admin approval";
  }

  if (role === "RIDER") {
    return "Your rider registration is pending admin approval";
  }

  return "Your account is pending admin approval";
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  if (APPROVAL_REQUIRED_ROLES.has(user.role) && user.approvalStatus !== "APPROVED") {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      getPendingLoginMessage(user.role, user.approvalStatus)
    );
  }

  const result = buildAuthResponse(user);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: result
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Current user fetched successfully",
    data: {
      user: pickUserResponse(user)
    }
  });
});

const listPendingApprovals = asyncHandler(async (_req, res) => {
  const pendingUsers = await prisma.user.findMany({
    where: {
      role: {
        in: [...APPROVAL_REQUIRED_ROLES]
      },
      approvalStatus: "PENDING"
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Pending registrations fetched successfully",
    data: {
      users: pendingUsers.map(pickUserResponse)
    }
  });
});

const updateApproval = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.validated.params.userId }
  });

  if (!user || !APPROVAL_REQUIRED_ROLES.has(user.role)) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Pending registration not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      approvalStatus: req.validated.body.status,
      approvalNotes: req.validated.body.approvalNotes || null,
      approvedAt: req.validated.body.status === "APPROVED" ? new Date() : null
    }
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message:
      req.validated.body.status === "APPROVED"
        ? `${user.role} registration approved successfully`
        : `${user.role} registration rejected successfully`,
    data: {
      user: pickUserResponse(updatedUser)
    }
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
  listPendingApprovals,
  updateApproval
};
