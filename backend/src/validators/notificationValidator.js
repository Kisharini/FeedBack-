const { z } = require("zod");

const notificationParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    notificationId: z.string().trim().min(1, "Notification id is required"),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  notificationParamsSchema,
};
