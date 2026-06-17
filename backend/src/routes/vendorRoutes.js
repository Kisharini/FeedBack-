const express = require("express");
const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { orderParamsSchema } = require("../validators/marketplaceValidator");

const router = express.Router();

const toMoney = (amount) => ({
  amount,
  currency: "MYR",
  formatted: `RM ${(amount / 100).toFixed(2)}`,
});

router.use(authMiddleware, allowRoles("VENDOR", "ADMIN"));

router.get("/listings", async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        vendorId: req.user.id,
        status: {
          not: "EXPIRED",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Vendor listings fetched successfully",
      data: {
        listings,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const vendorId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            listing: {
              vendorId,
            },
          },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          where: {
            listing: {
              vendorId,
            },
          },
          include: {
            listing: {
              select: {
                id: true,
                location: true,
                imageUrl: true,
                expiryAt: true,
                vendorId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedOrders = orders.map((order) => {
      const vendorSubtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
      const vendorItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        id: order.id,
        status: order.status,
        deliveryOption: order.deliveryOption,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        updatedAt: order.updatedAt,
        deliveryAddress: order.deliveryAddress,
        pickupInstructions: order.pickupInstructions,
        totalAmount: toMoney(order.totalAmount),
        vendorSubtotal: toMoney(vendorSubtotal),
        vendorItemCount,
        customer: {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          role: order.customer.role,
        },
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
                id: item.listing.id,
                location: item.listing.location,
                imageUrl: item.listing.imageUrl,
                expiryAt: item.listing.expiryAt,
              }
            : null,
        })),
      };
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Vendor orders fetched successfully",
      data: {
        orders: mappedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/orders/:orderId/confirm-pickup",
  validateRequest(orderParamsSchema),
  async (req, res, next) => {
    try {
      const vendorId = req.user.id;

      const order = await prisma.order.findFirst({
        where: {
          id: req.validated.params.orderId,
          items: {
            some: {
              listing: {
                vendorId,
              },
            },
          },
        },
      });

      if (!order) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Order not found",
        });
      }

      if (order.deliveryOption !== "SELF_PICKUP") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Only self-pickup orders can be manually marked as picked up",
        });
      }

      if (order.status === "COMPLETED") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "This order is already completed",
        });
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
            "Pickup confirmed by the vendor. The order has been completed successfully.",
        },
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Order marked as picked up successfully",
        data: {
          order: updatedOrder,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
