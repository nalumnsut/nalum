require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const authRoutes = require("./routes/auth/index.js");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const dbConnect = require("./config/database.config.js");
const profileRoutes = require("./routes/profile/index.js");
const pdfParser = require("./routes/parser.js");
const alumniRoutes = require("./routes/alumni.js");
const adminRoutes = require("./routes/admin/index.js");
const chatRoutes = require("./routes/chat/index.js");
const eventRoutes = require("./routes/events.js");
const postsRoutes = require("./routes/posts.js");
const reportsRoutes = require("./routes/reports.js");
const queriesRoutes = require("./routes/queries.js");
const givingRoutes = require("./routes/givings.js");
const notificationRoutes = require("./routes/notifications.js");
const alumniMapRoutes = require("./routes/alumniMap.js");
const geocodeRoutes = require("./routes/geocode.js");
const mentionRoutes = require("./routes/mention.js");
const { startProcessing } = require("./services/geocodingQueue");
const { checkBanned } = require("./middleware/checkBanned.js");
const morgan = require("morgan");
const redisConfig = require("./config/redis.config.js");
const { initializeSocket } = require("./sockets/chatSocket.js");
const { initPostgres } = require("./config/postgres.js");

const logStartupStep = (message) => {
  console.log(`[startup] ${message}`);
};

const listen = (port) =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

app.use(morgan("dev"));
app.use((req, res, next) => {
  console.log(
    `[DEBUG] Method: ${req.method} URL: ${req.url} Origin: ${req.headers.origin}`,
  );
  next();
});
app.use(
  cors({
    origin: [
      "https://alumni.nsut.ac.in",
      "http://localhost:5173",
      "http://localhost",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply checkBanned middleware to protected routes (not to auth or admin routes)
app.use("/api/auth", authRoutes);
app.use("/api/profile", checkBanned, profileRoutes);
app.use("/api/parser", checkBanned, pdfParser);
app.use("/api/alumni", checkBanned, alumniRoutes);
app.use("/api/chat", checkBanned, chatRoutes);
app.use("/api/events", checkBanned, eventRoutes);
app.use("/api/posts", checkBanned, postsRoutes);
app.use("/api/reports", checkBanned, reportsRoutes);
app.use("/api/queries", checkBanned, queriesRoutes);
app.use("/api/givings", checkBanned, givingRoutes);
app.use("/api/notifications", checkBanned, notificationRoutes);
app.use("/api/alumni-map", alumniMapRoutes);
app.use("/api/geocode", checkBanned, geocodeRoutes);
app.use("/api/mention", checkBanned, mentionRoutes);

// Admin routes (no checkBanned needed)
app.use("/api/admin", adminRoutes);

// Serve static files for newsletter uploads
app.use("/api/uploads", express.static("uploads"));

// a sample api call to check if the backend is working
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend is working!" });
});

const port = process.env.PORT || 2478;

async function startServer() {
  try {
    logStartupStep("Starting backend server...");

    logStartupStep("Connecting to Redis...");
    await redisConfig.connectRedis();
    logStartupStep("Redis initialization complete");

    logStartupStep("Connecting to MongoDB...");
    await dbConnect();
    logStartupStep("MongoDB initialization complete");

    logStartupStep("Connecting to Postgres...");
    const postgresConnected = await initPostgres();
    if (!postgresConnected) {
      throw new Error("Postgres connection check failed");
    }
    logStartupStep("Postgres initialization complete");

    logStartupStep("Starting geocoding queue worker...");
    startProcessing();
    logStartupStep("Geocoding queue worker started");

    logStartupStep("Initializing Socket.io...");
    const io = await initializeSocket(server);
    app.set("io", io);
    global.io = io; // Make io globally accessible for notifications
    logStartupStep("Socket.io initialization complete");

    logStartupStep(`Starting HTTP server on port ${port}...`);
    await listen(port);
    logStartupStep(`Server is running on port ${port}`);
    logStartupStep(`Socket.io is running on port ${port}`);
  } catch (err) {
    console.error("[startup] Backend startup failed:", err);
    process.exit(1);
  }
}

startServer();
