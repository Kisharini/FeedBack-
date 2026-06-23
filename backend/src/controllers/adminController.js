const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { createNotification } = require("../services/notificationService");
const pickUserResponse = require("../utils/pickUserResponse");

const DELIVERY_WATCH_STATUSES = ["FINDING_RIDER", "RIDER_ASSIGNED", "OUT_FOR_DELIVERY"];
const DASHBOARD_ALERT_LIMIT = 12;
const BANNED_ACCOUNT_MESSAGE = "Your account has been banned by an administrator. Please contact support if you believe this is a mistake.";

const alertIdFor = (scope, entityId) => `${scope}:${entityId}`;

const getListingSeverity = (listing) => {
  if (listing.expiryAt <= new Date() || listing.quantity <= 0) {
    return "HIGH";
  }

  return "MEDIUM";
};

const getOrderSeverity = (order) => {
  const hoursOpen = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60);
  return hoursOpen >= 4 ? "HIGH" : "MEDIUM";
};

const buildApprovalAlert = (user) => ({
  id: alertIdFor("APPROVAL", user.id),
  scope: "APPROVAL",
  severity: "MEDIUM",
  targetType: user.role,
  targetName: user.vendorBusinessName || user.ngoOrganizationName || user.name,
  issueTitle: `${user.role} registration awaiting review`,
  description: `${user.name} submitted a ${user.role.toLowerCase()} account for approval. Review documents and approve or reject the registration.`,
  reporterName: "Registration workflow",
  createdAt: user.createdAt,
  metadata: {
    email: user.email
  },
  actions: [
    {
      type: "OPEN_APPROVALS",
      label: "Review In Approvals",
      variant: "primary"
    }
  ]
});

const buildListingAlert = (listing) => ({
  id: alertIdFor("LISTING", listing.id),
  scope: "LISTING",
  severity: getListingSeverity(listing),
  targetType: "LISTING",
  targetName: listing.title,
  issueTitle:
    listing.expiryAt <= new Date()
      ? "Listing still active after expiry"
      : "Listing needs operational review",
  description:
    listing.expiryAt <= new Date()
      ? `${listing.title} is still marked available even though it expired at ${listing.expiryAt.toISOString()}.`
      : `${listing.title} is marked available with a non-positive quantity and should be retired from the marketplace.`,
  reporterName: "Marketplace integrity monitor",
  createdAt: listing.updatedAt,
  metadata: {
    listingId: listing.id,
    vendorId: listing.vendorId,
    vendorName: listing.vendor.vendorBusinessName || listing.vendor.name,
    location: listing.location
  },
  actions: [
    {
      type: "TAKE_DOWN_LISTING",
      label: "Take Down Listing",
      variant: "danger"
    },
    {
      type: "WARN_VENDOR",
      label: "Warn Vendor",
      variant: "secondary"
    },
    {
      type: "DISMISS_ALERT",
      label: "Dismiss",
      variant: "ghost"
    }
  ]
});

const buildOrderAlert = (order) => ({
  id: alertIdFor("ORDER", order.id),
  scope: "ORDER",
  severity: getOrderSeverity(order),
  targetType: "ORDER",
  targetName: `${order.customer.name} order`,
  issueTitle: `Delivery delay: ${order.status.replaceAll("_", " ")}`,
  description: `Order ${order.id} has remained in ${order.status.replaceAll("_", " ").toLowerCase()} since ${new Date(order.updatedAt).toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })}.`,
  reporterName: "Delivery operations monitor",
  createdAt: order.updatedAt,
  metadata: {
    orderId: order.id,
    customerId: order.customerId,
    customerName: order.customer.name,
    riderId: order.riderId,
    riderName: order.rider?.name || null
  },
  actions: [
    ...(order.riderId
      ? [
          {
            type: "WARN_RIDER",
            label: "Notify Rider",
            variant: "secondary"
          }
        ]
      : []),
    {
      type: "WARN_CUSTOMER",
      label: "Notify Customer",
      variant: "secondary"
    },
    {
      type: "DISMISS_ALERT",
      label: "Dismiss",
      variant: "ghost"
    }
  ]
});

const parseAlertId = (alertId) => {
  const [scope, entityId] = alertId.split(":");

  if (!scope || !entityId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid alert id");
  }

  return { scope, entityId };
};

const listAdminUsers = asyncHandler(async (req, res) => {
  const roleFilter = req.validated.query?.role;
  const search = req.validated.query?.search?.trim();

  const where = {};

  if (roleFilter && roleFilter !== "ALL") {
    where.role = roleFilter;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        email: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        ngoOrganizationName: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        vendorBusinessName: {
          contains: search,
          mode: "insensitive"
        }
      }
    ];
  }

  const [users, roleCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true
      }
    })
  ]);

  const counts = {
    ALL: roleCounts.reduce((sum, item) => sum + item._count.role, 0),
    INDIVIDUAL: 0,
    NGO: 0,
    VENDOR: 0,
    RIDER: 0,
    ADMIN: 0
  };

  roleCounts.forEach((item) => {
    counts[item.role] = item._count.role;
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Registered accounts fetched successfully",
    data: {
      counts,
      users: users.map(pickUserResponse)
    }
  });
});

const updateAdminUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;
  const { accountStatus } = req.validated.body;

  if (req.user.id === userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Admins cannot change their own account status");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const nextUser = await tx.user.update({
      where: {
        id: userId
      },
      data: {
        accountStatus
      }
    });

    if (accountStatus === "BANNED" && user.role === "VENDOR") {
      await tx.listing.updateMany({
        where: {
          vendorId: userId,
          status: "AVAILABLE"
        },
        data: {
          status: "EXPIRED",
          quantity: 0,
          expiryAt: new Date()
        }
      });
    }

    await createNotification(tx, {
      userId,
      type: "STATUS_UPDATE",
      title: accountStatus === "BANNED" ? "Account banned by admin" : "Account restored by admin",
      message:
        accountStatus === "BANNED"
          ? BANNED_ACCOUNT_MESSAGE
          : "Your account has been restored and can now access the platform again.",
      link: "/me"
    });

    return nextUser;
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message:
      accountStatus === "BANNED"
        ? `${user.name} has been banned successfully`
        : `${user.name} has been unbanned successfully`,
    data: {
      user: pickUserResponse(updatedUser)
    }
  });
});

const getAdminDashboard = asyncHandler(async (_req, res) => {
  const now = new Date();
  const delayedOrderCutoff = new Date(now.getTime() - 90 * 60 * 1000);

  const [
    pendingApprovalsCount,
    pendingApprovals,
    activeListingsCount,
    flaggedListings,
    delayedOrders,
    deliveryWatchCount,
    unreadNotificationsCount
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: {
          in: ["NGO", "VENDOR", "RIDER"]
        },
        approvalStatus: "PENDING"
      }
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ["NGO", "VENDOR", "RIDER"]
        },
        approvalStatus: "PENDING"
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 4
    }),
    prisma.listing.count({
      where: {
        status: "AVAILABLE",
        quantity: {
          gt: 0
        },
        expiryAt: {
          gt: now
        }
      }
    }),
    prisma.listing.findMany({
      where: {
        status: "AVAILABLE",
        OR: [
          {
            expiryAt: {
              lte: now
            }
          },
          {
            quantity: {
              lte: 0
            }
          }
        ]
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            vendorBusinessName: true
          }
        }
      },
      orderBy: [
        {
          expiryAt: "asc"
        },
        {
          updatedAt: "asc"
        }
      ],
      take: 4
    }),
    prisma.order.findMany({
      where: {
        deliveryOption: "DELIVERY",
        status: {
          in: DELIVERY_WATCH_STATUSES
        },
        updatedAt: {
          lte: delayedOrderCutoff
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        rider: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: "asc"
      },
      take: 4
    }),
    prisma.order.count({
      where: {
        deliveryOption: "DELIVERY",
        status: {
          in: DELIVERY_WATCH_STATUSES
        }
      }
    }),
    prisma.notification.count({
      where: {
        isRead: false
      }
    })
  ]);

  const alerts = [
    ...pendingApprovals.map(buildApprovalAlert),
    ...flaggedListings.map(buildListingAlert),
    ...delayedOrders.map(buildOrderAlert)
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, DASHBOARD_ALERT_LIMIT);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Admin control panel data fetched successfully",
    data: {
      summary: {
        pendingApprovals: pendingApprovalsCount,
        activeListings: activeListingsCount,
        deliveryWatch: deliveryWatchCount,
        unreadNotifications: unreadNotificationsCount,
        flaggedAlerts: alerts.length
      },
      alerts
    }
  });
});

const postAdminAlertAction = asyncHandler(async (req, res) => {
  const { scope, entityId } = parseAlertId(req.validated.params.alertId);
  const { action } = req.validated.body;

  if (action === "DISMISS_ALERT") {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Alert dismissed for this session"
    });
  }

  if (scope === "LISTING") {
    const listing = await prisma.listing.findUnique({
      where: {
        id: entityId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            vendorBusinessName: true
          }
        }
      }
    });

    if (!listing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Listing alert target not found");
    }

    if (action === "TAKE_DOWN_LISTING") {
      await prisma.listing.update({
        where: {
          id: listing.id
        },
        data: {
          status: "EXPIRED",
          quantity: 0,
          expiryAt: new Date()
        }
      });

      await createNotification(prisma, {
        userId: listing.vendorId,
        type: "STATUS_UPDATE",
        title: "Listing removed by admin",
        message: `${listing.title} was taken down by an administrator after a platform review.`,
        link: "/vendor/listings"
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Listing taken down successfully"
      });
    }

    if (action === "WARN_VENDOR") {
      await createNotification(prisma, {
        userId: listing.vendorId,
        type: "STATUS_UPDATE",
        title: "Admin warning on your listing",
        message: `Please review ${listing.title}. The admin team flagged it for marketplace compliance follow-up.`,
        link: "/vendor/listings"
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Vendor notified successfully"
      });
    }
  }

  if (scope === "ORDER") {
    const order = await prisma.order.findUnique({
      where: {
        id: entityId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        rider: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!order) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Order alert target not found");
    }

    if (action === "WARN_RIDER") {
      if (!order.riderId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "This order does not have an assigned rider yet");
      }

      await createNotification(prisma, {
        userId: order.riderId,
        type: "DELIVERY_REMINDER",
        title: "Admin follow-up required",
        message: `Please update the delivery status for order ${order.id}. The operations team is monitoring a delay.`,
        link: "/rider/dashboard"
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Rider notified successfully"
      });
    }

    if (action === "WARN_CUSTOMER") {
      await createNotification(prisma, {
        userId: order.customerId,
        type: "STATUS_UPDATE",
        title: "Order delay under review",
        message: `We're reviewing the delay on order ${order.id}. Thanks for your patience while the team follows up.`,
        link: `/marketplace/orders/${order.id}`
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Customer notified successfully"
      });
    }
  }

  throw new ApiError(StatusCodes.BAD_REQUEST, "This action is not available for the selected alert");
});

module.exports = {
  listAdminUsers,
  updateAdminUserStatus,
  getAdminDashboard,
  postAdminAlertAction
};
