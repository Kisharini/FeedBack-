const { z } = require("zod");

const recipientRoles = ["INDIVIDUAL", "NGO"];
const deliveryOptions = ["DELIVERY", "SELF_PICKUP"];
const paymentMethods = ["FPX", "TOUCH_N_GO", "GRABPAY", "BOOST", "SHOPEEPAY"];
const riderOrderStatuses = ["OUT_FOR_DELIVERY", "DELIVERED"];

const listingFiltersSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    location: z.string().trim().max(120).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
  }).optional(),
});

const listingParamsSchema = z.object({
  body: z.any().optional(),
  params: z.object({
    listingId: z.string(), 
  }),
  query: z.any().optional(),
}).passthrough();

const checkoutSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        listingId: z.string().trim().min(1, "Listing id is required"),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
      })
    ).min(1, "At least one listing is required"),
    deliveryOption: z.enum(deliveryOptions),
    paymentMethod: z.enum(paymentMethods),
    deliveryAddress: z.string().trim().min(10).max(300).optional(),
    deliveryLatitude: z.number().min(-90).max(90).optional(),
    deliveryLongitude: z.number().min(-180).max(180).optional(),
  }).superRefine((body, ctx) => {
    if (body.deliveryOption === "DELIVERY" && !body.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "Delivery address is required when delivery is selected",
      });
    }

    const hasDeliveryLatitude = typeof body.deliveryLatitude === "number";
    const hasDeliveryLongitude = typeof body.deliveryLongitude === "number";

    if (hasDeliveryLatitude !== hasDeliveryLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasDeliveryLatitude ? ["deliveryLongitude"] : ["deliveryLatitude"],
        message: "Delivery coordinates must include both latitude and longitude",
      });
    }
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const orderParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    orderId: z.string().trim().min(1, "Order id is required"),
  }),
  query: z.object({}).optional(),
});

const riderAcceptOrderSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).optional(),
  params: z.object({
    orderId: z.string().trim().min(1, "Order id is required"),
  }),
  query: z.object({}).optional(),
});

const riderStatusUpdateSchema = z.object({
  body: z.object({
    status: z.enum(riderOrderStatuses),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
  params: z.object({
    orderId: z.string().trim().min(1, "Order id is required"),
  }),
  query: z.object({}).optional(),
});

const riderLocationUpdateSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90, "Latitude is invalid"),
    longitude: z.number().min(-180).max(180, "Longitude is invalid"),
  }),
  params: z.object({
    orderId: z.string().trim().min(1, "Order id is required"),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  listingFiltersSchema,
  listingParamsSchema,
  checkoutSchema,
  orderParamsSchema,
  riderAcceptOrderSchema,
  riderStatusUpdateSchema,
  riderLocationUpdateSchema,
  recipientRoles,
  deliveryOptions,
  paymentMethods,
};
