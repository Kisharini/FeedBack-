const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { uploadNgoDocuments } = require("../middleware/uploadMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  googleLoginSchema,
  loginSchema,
  ngoApprovalSchema,
  registerSchema
} = require("../validators/authValidator");

const router = express.Router();

router.post(
  "/register",
  uploadNgoDocuments,
  validateRequest(registerSchema),
  authController.register
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/google", validateRequest(googleLoginSchema), authController.googleLogin);
router.get("/me", authMiddleware, authController.getCurrentUser);
router.get("/pending-approvals", authMiddleware, allowRoles("ADMIN"), authController.listPendingApprovals);
router.get("/ngo/pending", authMiddleware, allowRoles("ADMIN"), authController.listPendingApprovals);
router.patch(
  "/users/:userId/approval",
  authMiddleware,
  allowRoles("ADMIN"),
  validateRequest(ngoApprovalSchema),
  authController.updateApproval
);
router.patch(
  "/ngo/:userId/approval",
  authMiddleware,
  allowRoles("ADMIN"),
  validateRequest(ngoApprovalSchema),
  authController.updateApproval
);

module.exports = router;
