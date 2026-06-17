const express = require("express");
const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../services/notificationService");
const { notificationParamsSchema } = require("../validators/notificationValidator");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const data = await listNotifications(prisma, req.user.id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Notifications fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:notificationId/read", validateRequest(notificationParamsSchema), async (req, res, next) => {
  try {
    await markNotificationRead(prisma, req.user.id, req.validated.params.notificationId);
    const data = await listNotifications(prisma, req.user.id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Notification marked as read",
      data,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/read-all", async (req, res, next) => {
  try {
    await markAllNotificationsRead(prisma, req.user.id);
    const data = await listNotifications(prisma, req.user.id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "All notifications marked as read",
      data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
