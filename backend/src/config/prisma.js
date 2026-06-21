const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg"); 
const env = require("./env");
const pool = new Pool({
  connectionString: env.databaseUrl,
});

const adapter = new PrismaPg(pool);

const prismaLogLevels =
  process.env.PRISMA_QUERY_LOGS === "true" || process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["warn", "error"];

const prisma = new PrismaClient({
  adapter,
  log: prismaLogLevels
});

module.exports = prisma;