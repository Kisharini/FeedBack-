const { z } = require("zod");

const withdrawWalletSchema = z.object({
  body: z.object({
    bankName: z.string().trim().min(2, "Bank name is required").max(120),
    accountName: z.string().trim().min(2, "Account holder name is required").max(120),
    accountNumber: z.string().trim().min(4, "Account number is required").max(40),
    amount: z.coerce.number().int().min(100, "Minimum withdrawal is RM 1.00"),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = {
  withdrawWalletSchema,
};
