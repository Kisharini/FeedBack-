const express = require("express");
const authRoutes = require("./authRoutes");
const marketplaceRoutes = require("./marketplaceRoutes");
const notificationRoutes = require("./notificationRoutes");
const riderRoutes = require("./riderRoutes");
const vendorRoutes = require("./vendorRoutes");
const walletRoutes = require("./walletRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FeedBack API root",
    endpoints: [
      "/api/health",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/me",
      "/api/auth/pending-approvals",
      "/api/auth/users/:userId/approval",
      "/api/marketplace/listings",
      "/api/marketplace/orders",
      "/api/notifications",
      "/api/rider/jobs",
      "/api/vendor/orders",
      "/api/wallet"
    ]
  });
});

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FeedBack backend is running"
  });
});

router.use("/auth", authRoutes);
router.use("/marketplace", marketplaceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/rider", riderRoutes);
router.use("/vendor", vendorRoutes);
router.use("/wallet", walletRoutes);

module.exports = router;
