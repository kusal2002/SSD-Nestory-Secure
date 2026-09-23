const express = require("express");
const cors = require("cors");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());

// Add custom error handler for body-parser before json() middleware
app.use(express.json());
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    console.error(`[MALFORMED JSON] ${req.method} ${req.url}`);
    console.error(`  Headers:`, req.headers);
    console.error(`  Raw body attempt:`, error.body);
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
      error: error.message,
    });
  }
  next(error);
});

app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static files for uploads (must be before API routes)
app.use('/api/uploads', express.static('backend/uploads'));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/stories", require("./routes/storyLibrary/storyRoutes"));
app.use("/api/sessions", require("./routes/readingRoutes"));
app.use("/api/family", require("./routes/familyRoutes"));
app.use("/api/children", require("./routes/childRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/gamification", require("./routes/gamification/gamificationRoutes"));
app.use("/api/search-requests", require("./routes/searchRequestRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Nestory API",
    version: "1.0.0",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

module.exports = app;
