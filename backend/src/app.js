const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { notFoundMiddleware, errorMiddleware } = require("./middleware/errorMiddleware");
<<<<<<< HEAD
=======
const listingRoutes = require("./routes/listingRoute")
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

<<<<<<< HEAD
=======
app.use("/api/listings", listingRoutes);
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
