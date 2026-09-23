const storyService = require("../../services/storyLibrary/storyService");

// GET /api/stories
// Supports: search, ageGroup, genre, readingLevel, source, page, limit, sortBy, sortOrder
exports.getStories = async (req, res) => {
  try {
    const result = await storyService.listStories(req.query);

    return res.status(200).json({
      success: true,
      message: "Stories fetched",
      data: result.stories,
      meta: result.meta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};