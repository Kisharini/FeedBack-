const { z } = require("zod");

const roles = ["INDIVIDUAL", "NGO", "VENDOR", "RIDER", "ADMIN"];
const approvalStatuses = ["PENDING", "APPROVED", "REJECTED"];

const requireFields = (body, ctx, fields, message) => {
  fields.forEach((field) => {
    if (!body[field]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message
      });
    }
  });
};

const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100),
      email: z.string().trim().email("A valid email address is required").toLowerCase(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(72, "Password must not exceed 72 characters"),
      role: z.enum(roles),
      ngoOrganizationName: z.string().trim().min(2).max(150).optional(),
      ngoRegistrationNumber: z.string().trim().min(3).max(60).optional(),
      ngoContactPhone: z.string().trim().min(8).max(30).optional(),
      ngoAddress: z.string().trim().min(10).max(300).optional(),
      ngoDescription: z.string().trim().min(20).max(1000).optional(),
      vendorBusinessName: z.string().trim().min(2).max(150).optional(),
      vendorRegistrationNumber: z.string().trim().min(3).max(60).optional(),
      vendorPlaceAddress: z.string().trim().min(10).max(300).optional(),
      vendorContactPhone: z.string().trim().min(8).max(30).optional(),
      vendorDescription: z.string().trim().min(10).max(1000).optional(),
      riderLicenseNumber: z.string().trim().min(3).max(60).optional(),
      riderPhoneNumber: z.string().trim().min(8).max(30).optional(),
      riderVehicleType: z.string().trim().min(2).max(80).optional(),
      riderVehicleName: z.string().trim().min(2).max(120).optional(),
      riderVehiclePlateNumber: z.string().trim().min(2).max(30).optional(),
      riderVehicleColor: z.string().trim().min(2).max(50).optional(),
      riderAddress: z.string().trim().min(10).max(300).optional(),
      riderNotes: z.string().trim().min(10).max(1000).optional()
    })
    .superRefine((body, ctx) => {
      if (body.role === "NGO") {
        requireFields(
          body,
          ctx,
          [
            "ngoOrganizationName",
            "ngoRegistrationNumber",
            "ngoContactPhone",
            "ngoAddress",
            "ngoDescription"
          ],
          "This field is required for NGO registration"
        );
        return;
      }

      if (body.role === "VENDOR") {
        requireFields(
          body,
          ctx,
          [
            "vendorBusinessName",
            "vendorRegistrationNumber",
            "vendorPlaceAddress",
            "vendorContactPhone"
          ],
          "This field is required for vendor registration"
        );
        return;
      }

      if (body.role === "RIDER") {
        requireFields(
          body,
          ctx,
          [
            "riderLicenseNumber",
            "riderPhoneNumber",
            "riderVehicleType",
            "riderVehicleName",
            "riderVehiclePlateNumber",
            "riderAddress"
          ],
          "This field is required for rider registration"
        );
      }
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("A valid email address is required").toLowerCase(),
    password: z.string().min(1, "Password is required")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const googleLoginSchema = z.object({
  body: z.object({
    credential: z.string().trim().min(1, "Google credential is required")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const ngoApprovalSchema = z.object({
  body: z.object({
    status: z.enum(approvalStatuses.filter((status) => status !== "PENDING")),
    approvalNotes: z.string().trim().max(500).optional()
  }),
  params: z.object({
    userId: z.string().trim().min(1, "User id is required")
  }),
  query: z.object({}).optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  ngoApprovalSchema,
  roles
};
