require("dotenv").config();
console.log("Starting backend server...");
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

dbConnect();
initPostgres();
// connect to redis server (must be done before Socket.io initialization)
redisConfig
  .connectRedis()
  .then(() => {
    console.log("Redis initialization complete");

    // Start geocoding queue worker
    startProcessing();
    console.log("Geocoding queue worker started");

    // Initialize Socket.io for chat after Redis is ready
    initializeSocket(server)
      .then((io) => {
        app.set("io", io);
        global.io = io; // Make io globally accessible for notifications
        console.log("Socket.io initialization complete");
      })
      .catch((err) => {
        console.error("Socket.io initialization failed:", err);
      });
  })
  .catch((err) => {
    console.error("Redis initialization failed:", err);
    console.log("Continuing without Redis (some features may not work)");
  });

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

// listening to port
const port = process.env.PORT || 2478;
server.listen(port, "127.0.0.1", () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Socket.io is running on port ${port}`);
});
