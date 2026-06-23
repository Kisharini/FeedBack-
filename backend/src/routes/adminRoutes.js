const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  getAdminDashboard,
  listAdminUsers,
  updateAdminUserStatus,
  postAdminAlertAction
} = require("../controllers/adminController");
const {
  adminAlertActionSchema,
  adminUsersQuerySchema,
  adminUserStatusParamsSchema
} = require("../validators/adminValidator");

const router = express.Router();

router.use(authMiddleware, allowRoles("ADMIN"));

router.get("/dashboard", getAdminDashboard);
router.get("/users", validateRequest(adminUsersQuerySchema), listAdminUsers);
router.patch("/users/:userId/status", validateRequest(adminUserStatusParamsSchema), updateAdminUserStatus);
router.post("/alerts/:alertId/action", validateRequest(adminAlertActionSchema), postAdminAlertAction);

module.exports = router;
