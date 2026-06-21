CREATE TYPE "WalletTransactionType" AS ENUM ('ORDER_PAYOUT', 'WITHDRAWAL');

ALTER TABLE "users"
ADD COLUMN "walletBalance" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "WalletTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wallet_transactions_userId_idx" ON "wallet_transactions"("userId");
CREATE INDEX "wallet_transactions_orderId_idx" ON "wallet_transactions"("orderId");
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

ALTER TABLE "wallet_transactions"
ADD CONSTRAINT "wallet_transactions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
ADD CONSTRAINT "wallet_transactions_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
