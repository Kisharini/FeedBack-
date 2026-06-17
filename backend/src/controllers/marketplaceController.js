const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

const ROLE_TO_LISTING_TYPE = {
  INDIVIDUAL: "DISCOUNTED",
  NGO: "DONATION",
};

const DELIVERY_FEE_AMOUNT = 800;
const PICKUP_INSTRUCTIONS =
  "Bring your order confirmation, arrive within 30 minutes of readiness, and show the order id to the vendor.";

const MOCK_RIDER = {
  riderName: "Aiman Rider",
  riderPhoneNumber: "+60 12-555 7821",
  riderVehicle: "Yamaha Y15ZR",
  riderPlateNumber: "WXY 4821",
};

const TRACKING_STEPS = {
  FINDING_RIDER: {
    status: "RIDER_ASSIGNED",
    trackingLatitude: 3.139,
    trackingLongitude: 101.6869,
    trackingMessage: "A nearby rider has accepted your order and is heading to the vendor.",
    ...MOCK_RIDER,
  },
  RIDER_ASSIGNED: {
    status: "OUT_FOR_DELIVERY",
    trackingLatitude: 3.1455,
    trackingLongitude: 101.6952,
    trackingMessage: "Your rider has collected the order and is on the way.",
  },
  OUT_FOR_DELIVERY: {
    status: "DELIVERED",
    trackingLatitude: 3.1512,
    trackingLongitude: 101.7015,
    trackingMessage: "The rider has arrived at your drop-off point.",
  },
  DELIVERED: {
    status: "COMPLETED",
    trackingLatitude: 3.1512,
    trackingLongitude: 101.7015,
    trackingMessage: "Order completed successfully.",
  },
};

const buildListingAccess = (role) => {
  const allowedType = ROLE_TO_LISTING_TYPE[role];

  if (!allowedType) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "This feature is currently available only to individual and NGO users"
    );
  }

  return allowedType;
};

const toMoney = (amount) => ({
  amount,
  currency: "MYR",
  formatted: `RM ${(amount / 100).toFixed(2)}`,
});

const mapListing = (listing) => ({
  id: listing.id,
  title: listing.title,
  description: listing.description,
  type: listing.type,
  quantity: listing.quantity,
  expiryAt: listing.expiryAt,
  location: listing.location,
  imageUrl: listing.imageUrl,
  status: listing.status,
  unitPrice: listing.type === "DISCOUNTED" ? toMoney(listing.unitPrice || 0) : toMoney(0),
  accessRole: listing.type === "DISCOUNTED" ? "INDIVIDUAL" : "NGO",
  vendor: {
    id: listing.vendor.id,
    name: listing.vendor.name,
    businessName: listing.vendor.vendorBusinessName,
    contactPhone: listing.vendor.vendorContactPhone,
  },
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt,
});

const mapOrder = (order) => ({
  id: order.id,
  deliveryOption: order.deliveryOption,
  paymentMethod: order.paymentMethod,
  status: order.status,
  subtotalAmount: toMoney(order.subtotalAmount),
  deliveryFeeAmount: toMoney(order.deliveryFeeAmount),
  totalAmount: toMoney(order.totalAmount),
  deliveryAddress: order.deliveryAddress,
  pickupInstructions: order.pickupInstructions,
  rider: order.riderName
    ? {
        id: order.riderId,
        name: order.riderName,
        phoneNumber: order.riderPhoneNumber,
        vehicle: order.riderVehicle,
        plateNumber: order.riderPlateNumber,
      }
    : null,
  tracking: order.trackingLatitude && order.trackingLongitude
    ? {
        latitude: order.trackingLatitude,
        longitude: order.trackingLongitude,
        message: order.trackingMessage,
      }
    : order.trackingMessage
      ? {
          latitude: null,
          longitude: null,
          message: order.trackingMessage,
        }
      : null,
  paidAt: order.paidAt,
  deliveredAt: order.deliveredAt,
  completedAt: order.completedAt,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  items: order.items.map((item) => ({
    id: item.id,
    listingId: item.listingId,
    title: item.titleSnapshot,
    type: item.listingType,
    quantity: item.quantity,
    unitPrice: toMoney(item.unitPrice),
    lineTotal: toMoney(item.lineTotal),
    listing: item.listing
      ? {
          location: item.listing.location,
          imageUrl: item.listing.imageUrl,
          expiryAt: item.listing.expiryAt,
        }
      : null,
  })),
});

const buildListingWhereClause = (user, query = {}) => {
  const allowedType = buildListingAccess(user.role);
  const search = query.search?.trim();
  const location = query.location?.trim();

  const where = {
    type: allowedType,
    status: "AVAILABLE",
    quantity: {
      gt: 0,
    },
    expiryAt: {
      gt: new Date(),
    },
  };

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  if (typeof query.maxPrice === "number" && allowedType === "DISCOUNTED") {
    where.unitPrice = {
      lte: query.maxPrice,
    };
  }

  return where;
};

const listListings = asyncHandler(async (req, res) => {
  const where = buildListingWhereClause(req.user, req.validated.query);

  const listings = await prisma.listing.findMany({
    where,
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          vendorBusinessName: true,
          vendorContactPhone: true,
        },
      },
    },
    orderBy: [
      {
        expiryAt: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Listings fetched successfully",
    data: {
      audience: req.user.role,
      listings: listings.map(mapListing),
    },
  });
});

const getListingById = asyncHandler(async (req, res) => {
  const allowedType = buildListingAccess(req.user.role);

  const listing = await prisma.listing.findUnique({
    where: {
      id: req.validated.params.listingId,
    },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          vendorBusinessName: true,
          vendorContactPhone: true,
        },
      },
    },
  });

  if (!listing || listing.type !== allowedType) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Listing not found");
  }

  if (listing.status !== "AVAILABLE" || listing.quantity < 1 || listing.expiryAt <= new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "This listing is no longer available");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Listing fetched successfully",
    data: {
      listing: mapListing(listing),
    },
  });
});

const createOrder = asyncHandler(async (req, res) => {
  const allowedType = buildListingAccess(req.user.role);
  const { items, deliveryOption, paymentMethod, deliveryAddress } = req.validated.body;
  const listingIds = [...new Set(items.map((item) => item.listingId))];
  const quantityMap = new Map(items.map((item) => [item.listingId, item.quantity]));

  if (listingIds.length !== items.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Each listing can only appear once in the cart");
  }

  const now = new Date();

  const createdOrder = await prisma.$transaction(async (tx) => {
    const listings = await tx.listing.findMany({
      where: {
        id: {
          in: listingIds,
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            vendorBusinessName: true,
            vendorContactPhone: true,
          },
        },
      },
    });

    if (listings.length !== listingIds.length) {
      throw new ApiError(StatusCodes.NOT_FOUND, "One or more listings could not be found");
    }

    const invalidListing = listings.find((listing) => listing.type !== allowedType);

    if (invalidListing) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Your account cannot order this type of listing"
      );
    }

    const unavailableListing = listings.find(
      (listing) =>
        listing.status !== "AVAILABLE" ||
        listing.expiryAt <= now ||
        listing.quantity < (quantityMap.get(listing.id) || 0)
    );

    if (unavailableListing) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `${unavailableListing.title} no longer has enough quantity available`
      );
    }

    const subtotalAmount = listings.reduce((sum, listing) => {
      const quantity = quantityMap.get(listing.id) || 0;
      const unitPrice = listing.type === "DISCOUNTED" ? listing.unitPrice || 0 : 0;
      return sum + unitPrice * quantity;
    }, 0);

    const deliveryFeeAmount = deliveryOption === "DELIVERY" ? DELIVERY_FEE_AMOUNT : 0;
    const totalAmount = subtotalAmount + deliveryFeeAmount;
    const status = deliveryOption === "SELF_PICKUP" ? "READY_FOR_PICKUP" : "FINDING_RIDER";
    const trackingMessage =
      deliveryOption === "SELF_PICKUP"
        ? "Your order has been paid and is being prepared for pickup."
        : "Payment received. We are now finding a nearby rider for your order.";

    const order = await tx.order.create({
      data: {
        customerId: req.user.id,
        deliveryOption,
        paymentMethod,
        status,
        subtotalAmount,
        deliveryFeeAmount,
        totalAmount,
        deliveryAddress: deliveryOption === "DELIVERY" ? deliveryAddress : null,
        pickupInstructions: deliveryOption === "SELF_PICKUP" ? PICKUP_INSTRUCTIONS : null,
        trackingMessage,
        paidAt: now,
        items: {
          create: listings.map((listing) => {
            const quantity = quantityMap.get(listing.id) || 0;
            const unitPrice = listing.type === "DISCOUNTED" ? listing.unitPrice || 0 : 0;

            return {
              listingId: listing.id,
              titleSnapshot: listing.title,
              listingType: listing.type,
              quantity,
              unitPrice,
              lineTotal: unitPrice * quantity,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            listing: true,
          },
        },
      },
    });

    for (const listing of listings) {
      const quantity = quantityMap.get(listing.id) || 0;
      const remainingQuantity = listing.quantity - quantity;

      await tx.listing.update({
        where: {
          id: listing.id,
        },
        data: {
          quantity: remainingQuantity,
          status: remainingQuantity === 0 ? "CLAIMED" : "AVAILABLE",
          claimedById: remainingQuantity === 0 ? req.user.id : null,
          claimedAt: remainingQuantity === 0 ? now : null,
        },
      });
    }

    return order;
  });

  const orderWithCustomer = await prisma.order.findUnique({
    where: {
      id: createdOrder.id,
    },
    include: {
      items: {
        include: {
          listing: true,
        },
      },
    },
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Payment completed and order created successfully",
    data: {
      order: mapOrder(orderWithCustomer),
    },
  });
});

const listOrders = asyncHandler(async (req, res) => {
  buildListingAccess(req.user.role);

  const orders = await prisma.order.findMany({
    where: {
      customerId: req.user.id,
    },
    include: {
      items: {
        include: {
          listing: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Orders fetched successfully",
    data: {
      orders: orders.map(mapOrder),
    },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  buildListingAccess(req.user.role);

  const order = await prisma.order.findFirst({
    where: {
      id: req.validated.params.orderId,
      customerId: req.user.id,
    },
    include: {
      items: {
        include: {
          listing: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Order fetched successfully",
    data: {
      order: mapOrder(order),
    },
  });
});

const confirmSelfPickupOrder = asyncHandler(async (req, res) => {
  buildListingAccess(req.user.role);

  const order = await prisma.order.findFirst({
    where: {
      id: req.validated.params.orderId,
      customerId: req.user.id,
    },
    include: {
      items: {
        include: {
          listing: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  if (order.deliveryOption !== "SELF_PICKUP") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Only self-pickup orders can be manually marked as picked up"
    );
  }

  if (order.status === "COMPLETED") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "This order is already completed");
  }

  const now = new Date();

  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: "COMPLETED",
      deliveredAt: order.deliveredAt || now,
      completedAt: now,
      trackingMessage:
        "Pickup confirmed by the recipient. The order has been completed successfully.",
    },
    include: {
      items: {
        include: {
          listing: true,
        },
      },
    },
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Order marked as picked up successfully",
    data: {
      order: mapOrder(updatedOrder),
    },
  });
});

const advanceMockOrderStatus = asyncHandler(async (req, res) => {
  buildListingAccess(req.user.role);

  const order = await prisma.order.findFirst({
    where: {
      id: req.validated.params.orderId,
      customerId: req.user.id,
    },
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  }

  let nextState;
  let extraData = {};

  if (order.deliveryOption === "SELF_PICKUP") {
    if (order.status === "COMPLETED") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "This order is already completed");
    }

    nextState = "COMPLETED";
    extraData = {
      completedAt: new Date(),
      deliveredAt: new Date(),
      trackingMessage: "Pickup confirmed. Thank you for completing the order.",
    };
  } else {
    const progression = TRACKING_STEPS[order.status];

    if (!progression) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "This delivery order can no longer advance to another mocked status"
      );
    }

    nextState = progression.status;
    extraData = {
      riderName: progression.riderName ?? order.riderName,
      riderPhoneNumber: progression.riderPhoneNumber ?? order.riderPhoneNumber,
      riderVehicle: progression.riderVehicle ?? order.riderVehicle,
      riderPlateNumber: progression.riderPlateNumber ?? order.riderPlateNumber,
      trackingLatitude: progression.trackingLatitude,
      trackingLongitude: progression.trackingLongitude,
      trackingMessage: progression.trackingMessage,
      deliveredAt: progression.status === "DELIVERED" ? new Date() : order.deliveredAt,
      completedAt: progression.status === "COMPLETED" ? new Date() : order.completedAt,
    };
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: nextState,
      ...extraData,
    },
    include: {
      items: {
        include: {
          listing: true,
        },
      },
    },
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Order status updated successfully",
    data: {
      order: mapOrder(updatedOrder),
    },
  });
});

module.exports = {
  listListings,
  getListingById,
  createOrder,
  listOrders,
  getOrderById,
  confirmSelfPickupOrder,
  advanceMockOrderStatus,
};
