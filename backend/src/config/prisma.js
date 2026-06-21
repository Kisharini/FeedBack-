const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const env = require("./env");

const adapter = new PrismaPg({
  connectionString: env.databaseUrl
});

<<<<<<< HEAD
const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"]
=======
const prismaLogLevels =
  process.env.PRISMA_QUERY_LOGS === "true"
    ? ["query", "info", "warn", "error"]
    : ["warn", "error"];

const prisma = new PrismaClient({
  adapter,
  log: prismaLogLevels
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
});

module.exports = prisma;
