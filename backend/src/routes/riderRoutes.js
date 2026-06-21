const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  acceptJob,
  getActiveJob,
  listAvailableJobs,
  listJobHistory,
  updateJobLocation,
  updateJobStatus,
} = require("../controllers/riderController");
const {
  riderAcceptOrderSchema,
  riderLocationUpdateSchema,
  riderStatusUpdateSchema,
} = require("../validators/marketplaceValidator");

const router = express.Router();

router.use(authMiddleware, allowRoles("RIDER", "ADMIN"));

router.get("/jobs/available", listAvailableJobs);
router.get("/jobs/active", getActiveJob);
router.get("/jobs/history", listJobHistory);
router.post("/jobs/:orderId/accept", validateRequest(riderAcceptOrderSchema), acceptJob);
router.patch("/jobs/:orderId/status", validateRequest(riderStatusUpdateSchema), updateJobStatus);
router.patch("/jobs/:orderId/location", validateRequest(riderLocationUpdateSchema), updateJobLocation);

module.exports = router;
