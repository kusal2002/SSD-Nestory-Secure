const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const { initSocketServer } = require("./realtime/socketServer");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Static folders
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/stories", require("./routes/storyLibrary/storyRoutes"));
app.use("/api/search-requests", require("./routes/searchRequestRoutes"));
app.use("/api/sessions", require("./routes/readingRoutes"));
app.use("/api/family", require("./routes/familyRoutes"));
app.use("/api/children", require("./routes/childRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use(
  "/api/gamification",
  require("./routes/gamification/gamificationRoutes"),
);
app.use("/api/chat", require("./routes/chatRoutes"));

// Welcome Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Nestory API",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

// Export app for Vercel
module.exports = app;

// Start Server (for local development)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  initSocketServer(server);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
