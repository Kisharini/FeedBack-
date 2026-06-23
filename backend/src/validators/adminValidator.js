const { z } = require("zod");

const adminUserRoles = ["INDIVIDUAL", "NGO", "VENDOR", "RIDER", "ADMIN"];
const adminAccountStatuses = ["ACTIVE", "BANNED"];

const adminUsersQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    role: z.enum(["ALL", ...adminUserRoles]).optional(),
    search: z.string().trim().max(100).optional()
  }).optional()
});

const adminAlertActionSchema = z.object({
  body: z.object({
    action: z.enum([
      "TAKE_DOWN_LISTING",
      "WARN_VENDOR",
      "WARN_RIDER",
      "WARN_CUSTOMER",
      "DISMISS_ALERT"
    ])
  }),
  params: z.object({
    alertId: z.string().trim().min(3, "Alert id is required")
  }),
  query: z.object({}).optional()
});

const adminUserStatusParamsSchema = z.object({
  body: z.object({
    accountStatus: z.enum(adminAccountStatuses)
  }),
  params: z.object({
    userId: z.string().trim().min(1, "User id is required")
  }),
  query: z.object({}).optional()
});

module.exports = {
  adminUsersQuerySchema,
  adminAlertActionSchema,
  adminUserStatusParamsSchema
};
