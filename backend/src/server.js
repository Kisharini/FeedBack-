require("./config/env");

const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/prisma");

const startServer = async () => {
  try {
    await prisma.$connect();

    app.listen(env.port, () => {
      console.log(`FeedBack backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

startServer();
