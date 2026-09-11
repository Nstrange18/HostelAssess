const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const env = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const allowedOrigins = env.CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
  }),
);
app.use(express.json({ limit: "50kb" }));
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_req, res) =>
  res.json({
    success: true,
    message: "HostelAssess API is healthy.",
    data: { environment: env.NODE_ENV },
  }),
);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/hostels", require("./routes/hostelRoutes"));
app.use("/api/assessments", require("./routes/assessmentRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/admins", require("./routes/adminRoutes"));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
