const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const authMiddleware = require("../middleware/authMiddleware")

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
router.post("/", authMiddleware, async (req, res, next) => {
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

    const newListing = await prisma.listing.create({
      data: {
        title,
        description,
        type, 
        quantity: parsedQuantity,
        unitPrice: parsedUnitPrice,
        expiryAt: new Date(expiryAt),
        location,
        imageUrl,
        vendorId: activeUserId,
      },
    });

    return res.status(201).json(newListing);
  } catch (error) {
    console.error("DATABASE CRASH DETECTED:", error); 
    next(error);
  }
});

module.exports = router; 