const express = require("express");
const { StatusCodes } = require("http-status-codes");
const prisma = require("../config/prisma");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { listWalletSummary, mapWalletTransaction, withdrawWalletBalance } = require("../services/walletService");
const { withdrawWalletSchema } = require("../validators/walletValidator");

const router = express.Router();

router.use(authMiddleware, allowRoles("VENDOR", "RIDER", "ADMIN"));

router.get("/", async (req, res, next) => {
  try {
    const wallet = await listWalletSummary(prisma, req.user.id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Wallet fetched successfully",
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/withdraw", validateRequest(withdrawWalletSchema), async (req, res, next) => {
  try {
    const { bankName, accountName, accountNumber, amount } = req.validated.body;

    const transaction = await prisma.$transaction(async (tx) =>
      withdrawWalletBalance(tx, {
        userId: req.user.id,
        bankName,
        accountNumber,
        amount,
      })
    );

    const wallet = await listWalletSummary(prisma, req.user.id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Withdrawal request submitted for ${accountName}`,
      data: {
        balance: wallet.balance,
        transaction: mapWalletTransaction(transaction),
        transactions: wallet.transactions,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
