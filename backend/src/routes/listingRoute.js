const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadBufferToCloudinary } = require("../config/cloudinary");
const { uploadListingImage } = require("../middleware/uploadMiddleware");

// GET all listings
router.get("/", async (req, res, next) => {
  try {
    const data = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(data);
  } catch (error) {
    next(error); 
  }
});

// POST a new listing
router.post("/", authMiddleware, uploadListingImage, async (req, res, next) => {
  try {
    const { title, description, type, quantity, unitPrice, expiryAt, location, imageUrl } = req.body;
    
    const activeUserId = req.user?.id; 

    if (!activeUserId) {
      return res.status(401).json({ error: "Unauthorized: Missing vendor authentication tracking token." });
    }

    const parsedQuantity = parseInt(quantity, 10);
    const parsedUnitPrice = type === "DISCOUNTED" ? parseInt(unitPrice, 10) : null;

    if (isNaN(parsedQuantity)){
      return res.status(400).json({ error: "Validation Error: Quantity must be a valid number" });
    }

    if (type === "DISCOUNTED" && (isNaN(parsedUnitPrice) || parsedUnitPrice === null)) {
      return res.status(400).json({ error: "Validation Error: Discounted items require a valid numeric unit price" })
    }

    let resolvedImageUrl = imageUrl || null;

    if (req.file) {
      const upload = await uploadBufferToCloudinary(req.file, {
        folder: "feedback/listing-images",
        resource_type: "image"
      });
      resolvedImageUrl = upload.url;
    }

    const newListing = await prisma.listing.create({
      data: {
        title,
        description,
        type, 
        quantity: parsedQuantity,
        unitPrice: parsedUnitPrice,
        expiryAt: new Date(expiryAt),
        location,
        imageUrl: resolvedImageUrl,
        vendorId: activeUserId,
      },
    });

    return res.status(201).json(newListing);
  } catch (error) {
    console.error("DATABASE CRASH DETECTED:", error); 
    next(error);
  }
});

router.put("/:id", authMiddleware, uploadListingImage, async (req, res, next) => {
  try{
    const { id } = req.params;
    const activeUserId = req.user?.id;
    const { title, description, type, quantity, unitPrice, expiryAt, location, imageUrl } = req.body;

    if (!activeUserId){
      return res.status(401).json({ error: "Unauthorized: Missing vendor authentication token" });
    }

    const existingListing = await prisma.listing.findUnique({
      where: { id: id }
    });
    if (!existingListing){
      return res.status(404).json({ error: "Listing not found" })
    }
   if (existingListing.vendorId !== activeUserId) {
      return res.status(403).json({ error: "Forbidden: You do not own this listing" });
    }

    const parsedQuantity = quantity !== undefined ? parseInt(quantity, 10) : undefined;
    const parsedUnitPrice = type === "DISCOUNTED" ? parseInt(unitPrice, 10) : (type && type !== "DISCOUNTED" ? null : undefined);

    if (parsedQuantity !== undefined && isNaN(parsedQuantity)){
      return res.status(400).json({ error: "Validation Error: Quantity must be a valid number" });
    }
    let resolvedImageUrl = imageUrl;

    if (req.file) {
      const upload = await uploadBufferToCloudinary(req.file, {
        folder: "feedback/listing-images",
        resource_type: "image"
      });
      resolvedImageUrl = upload.url;
    }

    const updatedListing = await prisma.listing.update({
      where: { id: id },
      data: {
        title,
        description,
        type,
        ...(parsedQuantity !== undefined && { quantity: parsedQuantity }),
        ...(parsedUnitPrice !== undefined && { unitPrice: parsedUnitPrice }),
        ...(expiryAt && { expiryAt: new Date(expiryAt) }),
        location,
        ...(resolvedImageUrl !== undefined && { imageUrl: resolvedImageUrl || null }),
      },
    });
    return res.status(200).json(updatedListing);
   } catch (error) {
      console.error("DATABASE UPDATE CRASH DETECTED:", error);
      next(error);
   }
  });

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const activeUserId = req.user?.id;

    if (!activeUserId) {
      return res.status(401).json({ error: "Unauthorized: Missing vendor authentication tracking token." });
    }

    // 1. Verify ownership before deleting
    const existingListing = await prisma.listing.findUnique({
      where: { id: id }
    });

    if (!existingListing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (existingListing.vendorId !== activeUserId) {
      return res.status(403).json({ error: "Forbidden: You do not own this listing" });
    }

    const relatedOrderItemsCount = await prisma.orderItem.count({
      where: {
        listingId: id,
      },
    });

    if (relatedOrderItemsCount > 0) {
      await prisma.listing.update({
        where: { id },
        data: {
          status: "EXPIRED",
          quantity: 0,
          expiryAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        softDeleted: true,
        message: "Listing retired successfully. Existing orders remain intact.",
      });
    }

    await prisma.listing.delete({
      where: { id: id }
    });

    return res.status(200).json({ success: true, message: "Listing successfully removed." });
  } catch (error) {
    console.error("DATABASE DELETE CRASH DETECTED:", error);
    next(error);
  }
});

module.exports = router; 
