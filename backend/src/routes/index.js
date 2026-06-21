const express = require("express");
const authRoutes = require("./authRoutes");
<<<<<<< HEAD
=======
const marketplaceRoutes = require("./marketplaceRoutes");
const notificationRoutes = require("./notificationRoutes");
const riderRoutes = require("./riderRoutes");
const vendorRoutes = require("./vendorRoutes");
const walletRoutes = require("./walletRoutes");
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f

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
<<<<<<< HEAD
      "/api/auth/users/:userId/approval"
=======
      "/api/auth/users/:userId/approval",
      "/api/marketplace/listings",
      "/api/marketplace/orders",
      "/api/notifications",
      "/api/rider/jobs",
      "/api/vendor/orders",
      "/api/wallet"
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
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
<<<<<<< HEAD
=======
router.use("/marketplace", marketplaceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/rider", riderRoutes);
router.use("/vendor", vendorRoutes);
router.use("/wallet", walletRoutes);
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f

module.exports = router;
