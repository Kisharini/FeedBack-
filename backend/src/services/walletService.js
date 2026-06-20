const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/apiError");

const toMoney = (amount) => ({
  amount,
  currency: "MYR",
  formatted: `RM ${(amount / 100).toFixed(2)}`,
});

const mapWalletTransaction = (transaction) => ({
  id: transaction.id,
  type: transaction.type,
  amount: toMoney(transaction.amount),
  description: transaction.description,
  orderId: transaction.orderId,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});

const listWalletSummary = async (prismaClient, userId) => {
  const [user, transactions] = await Promise.all([
    prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        walletBalance: true,
      },
    }),
    prismaClient.walletTransaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
  ]);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User wallet not found");
  }

  return {
    balance: toMoney(user.walletBalance),
    transactions: transactions.map(mapWalletTransaction),
  };
};

const creditUserWallet = async (prismaClient, { userId, amount, description, orderId }) => {
  if (!amount || amount <= 0) {
    return null;
  }

  await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: {
      walletBalance: {
        increment: amount,
      },
    },
  });

  return prismaClient.walletTransaction.create({
    data: {
      userId,
      orderId,
      type: "ORDER_PAYOUT",
      amount,
      description,
    },
  });
};

const creditCompletedOrderWallets = async (prismaClient, order) => {
  const existingTransactions = await prismaClient.walletTransaction.findFirst({
    where: {
      orderId: order.id,
      type: "ORDER_PAYOUT",
    },
    select: {
      id: true,
    },
  });

  if (existingTransactions) {
    return;
  }

  const vendorPayouts = order.items.reduce((map, item) => {
    const vendorId = item.listing?.vendorId;

    if (!vendorId || item.lineTotal <= 0) {
      return map;
    }

    map.set(vendorId, (map.get(vendorId) || 0) + item.lineTotal);
    return map;
  }, new Map());

  for (const [vendorId, amount] of vendorPayouts.entries()) {
    await creditUserWallet(prismaClient, {
      userId: vendorId,
      amount,
      orderId: order.id,
      description: `Vendor payout for completed order #${order.id.slice(-8).toUpperCase()}`,
    });
  }

  if (order.deliveryOption === "DELIVERY" && order.riderId && order.deliveryFeeAmount > 0) {
    await creditUserWallet(prismaClient, {
      userId: order.riderId,
      amount: order.deliveryFeeAmount,
      orderId: order.id,
      description: `Rider payout for completed order #${order.id.slice(-8).toUpperCase()}`,
    });
  }
};

const withdrawWalletBalance = async (prismaClient, { userId, amount, bankName, accountNumber }) => {
  const user = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      walletBalance: true,
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User wallet not found");
  }

  if (amount <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Withdrawal amount must be greater than zero");
  }

  if (user.walletBalance < amount) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient wallet balance for this withdrawal");
  }

  await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: {
      walletBalance: {
        decrement: amount,
      },
    },
  });

  return prismaClient.walletTransaction.create({
    data: {
      userId,
      type: "WITHDRAWAL",
      amount: -amount,
      description: `Withdrawal to ${bankName} account ending ${accountNumber.slice(-4)}`,
    },
  });
};

module.exports = {
  creditCompletedOrderWallets,
  listWalletSummary,
  mapWalletTransaction,
  toMoney,
  withdrawWalletBalance,
};
