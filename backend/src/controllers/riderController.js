const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const {
  notifyOrderStatusReminder,
  notifyRiderAcceptedOrder,
} = require("../services/notificationService");

const ACTIVE_RIDER_STATUSES = ["RIDER_ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"];

const formatVehicle = (user) => {
  const vehicleParts = [user.riderVehicleType, user.riderVehicleName].filter(Boolean);
  return vehicleParts.join(" ").trim() || null;
};

const mapRiderOrder = (order) => ({
  id: order.id,
  status: order.status,
  deliveryOption: order.deliveryOption,
  paymentMethod: order.paymentMethod,
  totalAmount: order.totalAmount,
  deliveryAddress: order.deliveryAddress,
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
  customer: order.customer
    ? {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
        role: order.customer.role,
      }
    : null,
  vendor: order.items[0]?.listing?.vendor
    ? {
        id: order.items[0].listing.vendor.id,
        name: order.items[0].listing.vendor.name,
        businessName: order.items[0].listing.vendor.vendorBusinessName,
        contactPhone: order.items[0].listing.vendor.vendorContactPhone,
        address: order.items[0].listing.vendor.vendorPlaceAddress || order.items[0].listing.location,
      }
    : null,
  items: order.items.map((item) => ({
    id: item.id,
    title: item.titleSnapshot,
    quantity: item.quantity,
    listingType: item.listingType,
    pickupLocation: item.listing?.location || null,
    imageUrl: item.listing?.imageUrl || null,
  })),
});

const getBaseOrderInclude = () => ({
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  items: {
    include: {
      listing: {
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              vendorBusinessName: true,
              vendorContactPhone: true,
              vendorPlaceAddress: true,
            },
          },
        },
      },
    },
  },
});

const ensureRiderHasNoActiveJob = async (riderId, tx = prisma) => {
  const activeOrder = await tx.order.findFirst({
    where: {
      riderId,
      status: {
        in: ACTIVE_RIDER_STATUSES,
      },
    },
    select: {
      id: true,
    },
  });

  if (activeOrder) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You already have an active delivery order. Complete it before accepting another one."
    );
  }
};

const listAvailableJobs = asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      deliveryOption: "DELIVERY",
      status: "FINDING_RIDER",
      riderId: null,
    },
    include: getBaseOrderInclude(),
    orderBy: {
      createdAt: "asc",
    },
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Available rider jobs fetched successfully",
    data: {
      jobs: orders.map(mapRiderOrder),
    },
  });
});

const getActiveJob = asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: {
      riderId: req.user.id,
      status: {
        in: ACTIVE_RIDER_STATUSES,
      },
    },
    include: getBaseOrderInclude(),
    orderBy: {
      updatedAt: "desc",
    },
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Active rider job fetched successfully",
    data: {
      job: order ? mapRiderOrder(order) : null,
    },
  });
});

const listJobHistory = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      riderId: req.user.id,
      status: "COMPLETED",
    },
    include: getBaseOrderInclude(),
    orderBy: {
      completedAt: "desc",
    },
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Rider job history fetched successfully",
    data: {
      jobs: orders.map(mapRiderOrder),
    },
  });
});

const acceptJob = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.validated.body || {};

  const updatedOrder = await prisma.$transaction(async (tx) => {
    await ensureRiderHasNoActiveJob(req.user.id, tx);

    const order = await tx.order.findFirst({
      where: {
        id: req.validated.params.orderId,
        deliveryOption: "DELIVERY",
        status: "FINDING_RIDER",
        riderId: null,
      },
    });

    if (!order) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "This delivery is no longer available for rider acceptance."
      );
    }

    const acceptedOrder = await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        riderId: req.user.id,
        riderName: req.user.name,
        riderPhoneNumber: req.user.riderPhoneNumber,
        riderVehicle: formatVehicle(req.user),
        riderPlateNumber: req.user.riderVehiclePlateNumber,
        status: "RIDER_ASSIGNED",
        trackingLatitude: typeof latitude === "number" ? latitude : order.trackingLatitude,
        trackingLongitude: typeof longitude === "number" ? longitude : order.trackingLongitude,
        trackingMessage: `${req.user.name} accepted this order and is heading to the pickup point.`,
      },
      include: getBaseOrderInclude(),
    });

    await notifyRiderAcceptedOrder(tx, acceptedOrder);
    return acceptedOrder;
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Delivery job accepted successfully",
    data: {
      job: mapRiderOrder(updatedOrder),
    },
  });
});

const updateJobStatus = asyncHandler(async (req, res) => {
  const { status, latitude, longitude } = req.validated.body;

  const order = await prisma.order.findFirst({
    where: {
      id: req.validated.params.orderId,
      riderId: req.user.id,
      deliveryOption: "DELIVERY",
    },
    include: getBaseOrderInclude(),
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assigned delivery order not found");
  }

  const transitions = {
    RIDER_ASSIGNED: {
      nextStatus: "OUT_FOR_DELIVERY",
      requestedStatus: "OUT_FOR_DELIVERY",
      message: "The rider has collected the order and is now on the way to the customer.",
    },
    OUT_FOR_DELIVERY: {
      nextStatus: "DELIVERED",
      requestedStatus: "DELIVERED",
      message: "The rider has arrived at the delivery location and is waiting for handoff confirmation.",
    },
  };

  const transition = transitions[order.status];

  if (!transition || transition.requestedStatus !== status) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This rider status update is not allowed for the current order state"
    );
  }

  const now = new Date();
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const nextOrder = await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: transition.nextStatus,
        trackingLatitude: typeof latitude === "number" ? latitude : order.trackingLatitude,
        trackingLongitude: typeof longitude === "number" ? longitude : order.trackingLongitude,
        trackingMessage: transition.message,
        deliveredAt: transition.nextStatus === "DELIVERED" ? now : order.deliveredAt,
      },
      include: getBaseOrderInclude(),
    });

    await notifyOrderStatusReminder(tx, nextOrder, transition.nextStatus);
    return nextOrder;
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Delivery job updated successfully",
    data: {
      job: mapRiderOrder(updatedOrder),
    },
  });
});

const updateJobLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.validated.body;

  const order = await prisma.order.findFirst({
    where: {
      id: req.validated.params.orderId,
      riderId: req.user.id,
      status: {
        in: ACTIVE_RIDER_STATUSES,
      },
    },
    include: getBaseOrderInclude(),
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Active rider order not found");
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      trackingLatitude: latitude,
      trackingLongitude: longitude,
    },
    include: getBaseOrderInclude(),
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Rider location updated successfully",
    data: {
      job: mapRiderOrder(updatedOrder),
    },
  });
});

module.exports = {
  acceptJob,
  getActiveJob,
  listAvailableJobs,
  listJobHistory,
  updateJobLocation,
  updateJobStatus,
};
