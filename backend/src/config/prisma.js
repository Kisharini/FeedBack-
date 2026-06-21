const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const env = require("./env");

// Initialize PostgreSQL connection adapter pooling mechanics
const adapter = new PrismaPg({
  connectionString: env.databaseUrl
});

const prismaLogLevels =
  process.env.PRISMA_QUERY_LOGS === "true" || process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["warn", "error"];

const prisma = new PrismaClient({
  adapter,
  log: prismaLogLevels
});

module.exports = prisma;