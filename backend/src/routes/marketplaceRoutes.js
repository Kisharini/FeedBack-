const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  listListings,
  getListingById,
  estimateDeliveryFee,
  createOrder,
  listOrders,
  getOrderById,
  confirmSelfPickupOrder,
  advanceMockOrderStatus,
} = require("../controllers/marketplaceController");
const {
  listingFiltersSchema,
  listingParamsSchema,
  checkoutSchema,
  deliveryFeeEstimateSchema,
  orderParamsSchema,
  recipientRoles,
} = require("../validators/marketplaceValidator");

const router = express.Router();

router.use(authMiddleware, allowRoles(...recipientRoles));

router.get("/listings", validateRequest(listingFiltersSchema), listListings);
router.get("/listings/:listingId", validateRequest(listingParamsSchema), getListingById);
router.post(
  "/orders/delivery-fee-estimate",
  validateRequest(deliveryFeeEstimateSchema),
  estimateDeliveryFee
);
router.post("/orders/checkout", validateRequest(checkoutSchema), createOrder);
router.get("/orders", listOrders);
router.get("/orders/:orderId", validateRequest(orderParamsSchema), getOrderById);
router.post(
  "/orders/:orderId/confirm-pickup",
  validateRequest(orderParamsSchema),
  confirmSelfPickupOrder
);
router.post(
  "/orders/:orderId/mock-progress",
  validateRequest(orderParamsSchema),
  advanceMockOrderStatus
);

module.exports = router;
