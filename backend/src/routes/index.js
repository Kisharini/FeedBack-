const express = require("express");
const authRoutes = require("./authRoutes");
const marketplaceRoutes = require("./marketplaceRoutes");
const vendorRoutes = require("./vendorRoutes");

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
      "/api/marketplace/orders"
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
router.use("/vendor", vendorRoutes);

module.exports = router;
