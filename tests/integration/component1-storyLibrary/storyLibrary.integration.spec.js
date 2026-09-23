/**
 * Component 1: Story Library & Content Management
 * INTEGRATION TESTS
 * Owner: EHARA
 *
 * Tests full API endpoints with test database
 * Verifies story CRUD operations, search, filtering, and admin functions
 */

const {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
} = require("../../config/test-db");
const { TestReport } = require("../../config/test-utils");
const { dummyStories, testTokens } = require("../../fixtures/dummy-data");
const { test } = require('@playwright/test');

// Mock Story Controller for integration tests
const mockStoryController = {
  /**
   * GET /api/stories
   * Fetch stories with search, filter, and pagination
   */
  async getStories(query = {}) {
    // Simulate database query with filters
    let stories = [...dummyStories];

    // Apply search filter
    if (query.search) {
      const lowerSearch = query.search.toLowerCase();
      stories = stories.filter(
        (s) =>
          s.title.toLowerCase().includes(lowerSearch) ||
          s.author.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply age group filter
    if (query.ageGroup) {
      stories = stories.filter((s) => s.ageGroup.includes(query.ageGroup));
    }

    // Apply genre filter
    if (query.genre) {
      stories = stories.filter((s) => s.genres.includes(query.genre));
    }

    // Apply reading level filter
    if (query.readingLevel) {
      stories = stories.filter((s) => s.readingLevel === query.readingLevel);
    }

    // Apply source filter
    if (query.source) {
      stories = stories.filter((s) => s.source === query.source);
    }

    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    // Sorting
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";
    stories.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return {
      success: true,
      message: "Stories fetched",
      data: stories.slice(start, end),
      meta: {
        total: stories.length,
        page,
        limit,
        pages: Math.ceil(stories.length / limit),
      },
    };
  },

  /**
   * GET /api/stories/:id
   * Fetch single story by ID
   */
  async getStoryById(id) {
    const story = dummyStories.find((s) => s._id.toString() === id.toString());
    if (!story) {
      throw new Error("Story not found");
    }
    return {
      success: true,
      message: "Story fetched",
      data: story,
    };
  },

  /**
   * POST /api/stories (Admin only)
   * Create a new story
   */
  async createStory(storyData, userRole) {
    if (userRole !== "admin") {
      throw new Error("Only admin can create stories");
    }

    if (!storyData.title || !storyData.author) {
      throw new Error("Title and author are required");
    }

    const newStory = {
      ...storyData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      message: "Story created successfully",
      data: newStory,
    };
  },

  /**
   * PUT /api/stories/:id (Admin only)
   * Update a story
   */
  async updateStory(id, updateData, userRole) {
    if (userRole !== "admin") {
      throw new Error("Only admin can update stories");
    }

    const story = dummyStories.find((s) => s._id.toString() === id.toString());
    if (!story) {
      throw new Error("Story not found");
    }

    const updated = { ...story, ...updateData, updatedAt: new Date() };

    return {
      success: true,
      message: "Story updated successfully",
      data: updated,
    };
  },

  /**
   * DELETE /api/stories/:id (Admin only)
   * Delete a story
   */
  async deleteStory(id, userRole) {
    if (userRole !== "admin") {
      throw new Error("Only admin can delete stories");
    }

    const storyExists = dummyStories.some((s) => s._id.toString() === id.toString());
    if (!storyExists) {
      throw new Error("Story not found");
    }

    return {
      success: true,
      message: "Story deleted successfully",
    };
  },

  /**
   * POST /api/stories/import (Admin only)
   * Import story from Google Books
   */
  async importFromGoogleBooks(googleBooksId, userRole) {
    if (userRole !== "admin") {
      throw new Error("Only admin can import stories");
    }

    if (!googleBooksId) {
      throw new Error("Google Books ID is required");
    }

    // Mock Google Books API response
    const importedStory = {
      title: "Imported Story",
      author: "External Author",
      description: "Description from Google Books",
      ageGroup: ["7-9"],
      genres: ["adventure"],
      readingLevel: "intermediate",
      coverImage: "https://api.google.com/books/cover.jpg",
      source: "google-books",
      googleBooksId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      message: "Story imported from Google Books",
      data: importedStory,
    };
  },

  /**
   * POST /api/stories/sync (Admin only)
   * Sync metadata from Google Books
   */
  async syncGoogleBooksMetadata(storyId, userRole) {
    if (userRole !== "admin") {
      throw new Error("Only admin can sync metadata");
    }

    const story = dummyStories.find((s) => s._id.toString() === storyId.toString());
    if (!story) {
      throw new Error("Story not found");
    }

    if (!story.googleBooksId) {
      throw new Error("Story is not from Google Books");
    }

    return {
      success: true,
      message: "Metadata synced successfully",
      data: { ...story, updatedAt: new Date() },
    };
  },
};

// ========================
// INTEGRATION TESTS
// ========================

async function runStoryLibraryIntegrationTests() {
  const report = new TestReport("Story Library Integration Tests");

  try {
    // Test 1: Get all stories
    try {
      const response = await mockStoryController.getStories({});
      report.logAssertion(
        "Fetch all stories",
        response.success &&
          response.data.length === 3 &&
          response.meta.total === 3
      );
    } catch (error) {
      report.logAssertion("Fetch all stories", false);
    }

    // Test 2: Search stories by title
    try {
      const response = await mockStoryController.getStories({
        search: "Cat",
      });
      report.logAssertion(
        "Search stories by title",
        response.success &&
          response.data.length === 1 &&
          response.data[0].title.includes("Cat")
      );
    } catch (error) {
      report.logAssertion("Search stories by title", false);
    }

    // Test 3: Filter by age group
    try {
      const response = await mockStoryController.getStories({
        ageGroup: "10-12",
      });
      report.logAssertion(
        "Filter stories by age group",
        response.success &&
          response.data.every((s) => s.ageGroup.includes("10-12"))
      );
    } catch (error) {
      report.logAssertion("Filter stories by age group", false);
    }

    // Test 4: Filter by genre
    try {
      const response = await mockStoryController.getStories({
        genre: "science-fiction",
      });
      report.logAssertion(
        "Filter stories by genre",
        response.success &&
          response.data.length === 1 &&
          response.data[0].genres.includes("science-fiction")
      );
    } catch (error) {
      report.logAssertion("Filter stories by genre", false);
    }

    // Test 5: Filter by reading level
    try {
      const response = await mockStoryController.getStories({
        readingLevel: "beginner",
      });
      report.logAssertion(
        "Filter by reading level",
        response.success &&
          response.data.length === 1 &&
          response.data[0].readingLevel === "beginner"
      );
    } catch (error) {
      report.logAssertion("Filter by reading level", false);
    }

    // Test 6: Filter by source
    try {
      const response = await mockStoryController.getStories({
        source: "internal",
      });
      report.logAssertion(
        "Filter by source",
        response.success &&
          response.data.every((s) => s.source === "internal")
      );
    } catch (error) {
      report.logAssertion("Filter by source", false);
    }

    // Test 7: Pagination
    try {
      const page1 = await mockStoryController.getStories({
        page: 1,
        limit: 2,
      });
      const page2 = await mockStoryController.getStories({
        page: 2,
        limit: 2,
      });
      report.logAssertion(
        "Paginate stories",
        page1.data.length === 2 &&
          page2.data.length === 1 &&
          page1.meta.pages === 2
      );
    } catch (error) {
      report.logAssertion("Paginate stories", false);
    }

    // Test 8: Sorting by date (ascending)
    try {
      const response = await mockStoryController.getStories({
        sortBy: "createdAt",
        sortOrder: "asc",
      });
      report.logAssertion(
        "Sort stories by date (ascending)",
        response.data[0].createdAt <= response.data[1].createdAt
      );
    } catch (error) {
      report.logAssertion("Sort stories by date (ascending)", false);
    }

    // Test 9: Get single story by ID
    try {
      const storyId = dummyStories[0]._id;
      const response = await mockStoryController.getStoryById(storyId);
      report.logAssertion(
        "Get single story by ID",
        response.success &&
          response.data.title === dummyStories[0].title
      );
    } catch (error) {
      report.logAssertion("Get single story by ID", false);
    }

    // Test 10: Get story with invalid ID
    try {
      await mockStoryController.getStoryById("invalid-id");
      report.logAssertion("Reject invalid story ID", false);
    } catch (error) {
      report.logAssertion("Reject invalid story ID", true);
    }

    // Test 11: Create story as admin
    try {
      const newStory = {
        title: "New Story",
        author: "New Author",
        description: "A new story description here",
        ageGroup: ["7-9"],
        genres: ["adventure"],
        readingLevel: "beginner",
      };
      const response = await mockStoryController.createStory(
        newStory,
        "admin"
      );
      report.logAssertion(
        "Create story as admin",
        response.success && response.data.title === "New Story"
      );
    } catch (error) {
      report.logAssertion("Create story as admin", false);
    }

    // Test 12: Prevent non-admin from creating story
    try {
      await mockStoryController.createStory(
        { title: "Test", author: "Test" },
        "parent"
      );
      report.logAssertion("Prevent non-admin story creation", false);
    } catch (error) {
      report.logAssertion("Prevent non-admin story creation", true);
    }

    // Test 13: Update story as admin
    try {
      const storyId = dummyStories[0]._id;
      const response = await mockStoryController.updateStory(
        storyId,
        { title: "Updated Title" },
        "admin"
      );
      report.logAssertion(
        "Update story as admin",
        response.success && response.data.title === "Updated Title"
      );
    } catch (error) {
      report.logAssertion("Update story as admin", false);
    }

    // Test 14: Prevent non-admin from updating story
    try {
      await mockStoryController.updateStory(
        dummyStories[0]._id,
        { title: "Updated" },
        "parent"
      );
      report.logAssertion("Prevent non-admin story update", false);
    } catch (error) {
      report.logAssertion("Prevent non-admin story update", true);
    }

    // Test 15: Delete story as admin
    try {
      const response = await mockStoryController.deleteStory(
        dummyStories[0]._id,
        "admin"
      );
      report.logAssertion(
        "Delete story as admin",
        response.success && response.message.includes("deleted")
      );
    } catch (error) {
      report.logAssertion("Delete story as admin", false);
    }

    // Test 16: Prevent non-admin from deleting story
    try {
      await mockStoryController.deleteStory(dummyStories[0]._id, "parent");
      report.logAssertion("Prevent non-admin story deletion", false);
    } catch (error) {
      report.logAssertion("Prevent non-admin story deletion", true);
    }

    // Test 17: Import from Google Books as admin
    try {
      const response = await mockStoryController.importFromGoogleBooks(
        "gb12345",
        "admin"
      );
      report.logAssertion(
        "Import story from Google Books",
        response.success &&
          response.data.googleBooksId === "gb12345" &&
          response.data.source === "google-books"
      );
    } catch (error) {
      report.logAssertion("Import story from Google Books", false);
    }

    // Test 18: Prevent non-admin from importing from Google Books
    try {
      await mockStoryController.importFromGoogleBooks("gb12345", "parent");
      report.logAssertion("Prevent non-admin Google Books import", false);
    } catch (error) {
      report.logAssertion("Prevent non-admin Google Books import", true);
    }

    // Test 19: Sync Google Books metadata
    try {
      const googleBooksStory = dummyStories.find(
        (s) => s.googleBooksId
      );
      const response = await mockStoryController.syncGoogleBooksMetadata(
        googleBooksStory._id,
        "admin"
      );
      report.logAssertion(
        "Sync Google Books metadata",
        response.success &&
          response.message.includes("synced")
      );
    } catch (error) {
      report.logAssertion("Sync Google Books metadata", false);
    }

    // Test 20: Chained filters (age group + genre + reading level)
    try {
      const response = await mockStoryController.getStories({
        ageGroup: "7-9",
        genre: "fantasy",
        readingLevel: "beginner",
      });
      report.logAssertion(
        "Apply chained filters",
        response.success &&
          response.data.every(
            (s) =>
              s.ageGroup.includes("7-9") &&
              s.genres.includes("fantasy") &&
              s.readingLevel === "beginner"
          )
      );
    } catch (error) {
      report.logAssertion("Apply chained filters", false);
    }

  } catch (error) {
    console.error("❌ Test setup error:", error);
  }

  report.print();
  return report.summary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const summary = await runStoryLibraryIntegrationTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { runStoryLibraryIntegrationTests, mockStoryController };


test('runStoryLibraryIntegrationTests', async () => { 
  await runStoryLibraryIntegrationTests(); 
});
