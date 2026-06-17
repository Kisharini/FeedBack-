const prisma = require("../config/prisma");

const mapNotification = (notification) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  link: notification.link,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const createNotification = (prismaClient, data) =>
  prismaClient.notification.create({
    data,
  });

const createNotificationsForUsers = async (prismaClient, userIds, notification) => {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];

  if (!uniqueUserIds.length) {
    return [];
  }

  await prismaClient.notification.createMany({
    data: uniqueUserIds.map((userId) => ({
      userId,
      ...notification,
    })),
  });

  return uniqueUserIds;
};

const notifyNewListing = async (prismaClient, listing) => {
  const targetRoles = listing.type === "DISCOUNTED" ? ["INDIVIDUAL"] : ["NGO"];

  const users = await prismaClient.user.findMany({
    where: {
      role: {
        in: targetRoles,
      },
      approvalStatus: "APPROVED",
    },
    select: {
      id: true,
    },
  });

  return createNotificationsForUsers(
    prismaClient,
    users.map((user) => user.id),
    {
      type: "LISTING_ALERT",
      title:
        listing.type === "DISCOUNTED"
          ? "New discounted food listing available"
          : "New donation listing available",
      message: `${listing.title} is now available in ${listing.location}.`,
      link: `/marketplace/listings/${listing.id}`,
    }
  );
};

const notifyClaimCreated = async (prismaClient, { order, customer, listings }) => {
  const vendorIds = [...new Set(listings.map((listing) => listing.vendorId).filter(Boolean))];

  await createNotificationsForUsers(prismaClient, vendorIds, {
    type: "CLAIM_ALERT",
    title: "Your listing has been claimed",
    message: `${customer.name} placed an order that includes your listing items.`,
    link: "/vendor/orders",
  });

  if (order.deliveryOption === "SELF_PICKUP") {
    await createNotificationsForUsers(prismaClient, [customer.id], {
      type: "PICKUP_REMINDER",
      title: "Pickup details ready",
      message: "Your order has been confirmed and pickup instructions are available.",
      link: `/marketplace/orders/${order.id}`,
    });
  } else {
    await createNotificationsForUsers(prismaClient, [customer.id], {
      type: "DELIVERY_REMINDER",
      title: "Delivery order confirmed",
      message: "Your order has been confirmed and rider assignment is in progress.",
      link: `/marketplace/orders/${order.id}`,
    });
  }
};

const notifyRiderAcceptedOrder = async (prismaClient, order) => {
  const vendorIds = [...new Set(order.items.map((item) => item.listing?.vendorId).filter(Boolean))];
  const sharedMessage = `${order.riderName || "A rider"} accepted the order and is heading to the pickup point.`;

  await createNotificationsForUsers(prismaClient, [order.customerId], {
    type: "STATUS_UPDATE",
    title: "Rider assigned",
    message: sharedMessage,
    link: `/marketplace/orders/${order.id}`,
  });

  await createNotificationsForUsers(prismaClient, vendorIds, {
    type: "STATUS_UPDATE",
    title: "Rider assigned to your order",
    message: sharedMessage,
    link: "/vendor/orders",
  });
};

const notifyOrderStatusReminder = async (prismaClient, order, nextStatus) => {
  const vendorIds = [...new Set(order.items.map((item) => item.listing?.vendorId).filter(Boolean))];

  if (nextStatus === "OUT_FOR_DELIVERY") {
    await createNotificationsForUsers(prismaClient, [order.customerId], {
      type: "DELIVERY_REMINDER",
      title: "Order on the way",
      message: "Your rider has collected the order and is now heading to your delivery address.",
      link: `/marketplace/orders/${order.id}`,
    });

    await createNotificationsForUsers(prismaClient, vendorIds, {
      type: "PICKUP_REMINDER",
      title: "Order picked up",
      message: "The rider has collected the order from your location.",
      link: "/vendor/orders",
    });
  }

  if (nextStatus === "DELIVERED") {
    await createNotificationsForUsers(prismaClient, [order.customerId], {
      type: "DELIVERY_REMINDER",
      title: "Rider has arrived",
      message: "Your rider has arrived at the delivery location. Please confirm receipt once handoff is complete.",
      link: `/marketplace/orders/${order.id}`,
    });
  }
};

const listNotifications = async (prismaClient, userId) => {
  const [notifications, unreadCount] = await Promise.all([
    prismaClient.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    }),
    prismaClient.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  return {
    unreadCount,
    notifications: notifications.map(mapNotification),
  };
};

const markNotificationRead = async (prismaClient, userId, notificationId) =>
  prismaClient.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });

const markAllNotificationsRead = async (prismaClient, userId) =>
  prismaClient.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

module.exports = {
  createNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notifyClaimCreated,
  notifyNewListing,
  notifyOrderStatusReminder,
  notifyRiderAcceptedOrder,
  mapNotification,
};
