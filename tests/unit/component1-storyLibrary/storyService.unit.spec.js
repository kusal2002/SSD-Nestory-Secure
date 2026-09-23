/**
 * Component 1: Story Library & Content Management
 * UNIT TESTS - Story Service
 * Owner: EHARA
 *
 * Tests core story service functions in isolation without database or external APIs
 */

const { test, expect } = require('@playwright/test');
const { TestReport } = require('../../config/test-utils');
const { dummyStories } = require("../../fixtures/dummy-data");

// Mock Story Service for unit testing
const mockStoryService = {
  /**
   * Filter stories by age group
   */
  filterByAgeGroup(stories, ageGroup) {
    if (!ageGroup || !Array.isArray(stories)) {
      throw new Error("Invalid input");
    }
    return stories.filter((story) => story.ageGroup.includes(ageGroup));
  },

  /**
   * Filter stories by genre
   */
  filterByGenre(stories, genre) {
    if (!genre || !Array.isArray(stories)) {
      throw new Error("Invalid input");
    }
    return stories.filter((story) => story.genres.includes(genre));
  },

  /**
   * Filter stories by reading level
   */
  filterByReadingLevel(stories, level) {
    if (!level || !Array.isArray(stories)) {
      throw new Error("Invalid input");
    }
    return stories.filter((story) => story.readingLevel === level);
  },

  /**
   * Search stories by title or author
   */
  searchStories(stories, query) {
    if (!query || typeof query !== "string") {
      throw new Error("Invalid search query");
    }
    const lowerQuery = query.toLowerCase();
    return stories.filter(
      (story) =>
        story.title.toLowerCase().includes(lowerQuery) ||
        story.author.toLowerCase().includes(lowerQuery) ||
        story.description.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Validate story data
   */
  validateStoryData(storyData) {
    const errors = [];

    if (!storyData.title || typeof storyData.title !== "string") {
      errors.push("Title is required and must be a string");
    }

    if (!storyData.author || typeof storyData.author !== "string") {
      errors.push("Author is required and must be a string");
    }

    if (!storyData.ageGroup || !Array.isArray(storyData.ageGroup) || storyData.ageGroup.length === 0) {
      errors.push("Age group is required and must be a non-empty array");
    }

    if (!storyData.genres || !Array.isArray(storyData.genres) || storyData.genres.length === 0) {
      errors.push("Genres is required and must be a non-empty array");
    }

    if (!storyData.readingLevel) {
      errors.push("Reading level is required");
    }

    if (!storyData.description || storyData.description.length < 10) {
      errors.push("Description is required and must be at least 10 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Calculate reading level score
   */
  calculateReadingLevelScore(level) {
    const scores = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };
    return scores[level] || 0;
  },

  /**
   * Check for duplicate stories
   */
  checkDuplicate(stories, newStory) {
    return stories.some(
      (story) =>
        story.title.toLowerCase() === newStory.title.toLowerCase() &&
        story.author.toLowerCase() === newStory.author.toLowerCase()
    );
  },

  /**
   * Sort stories by field
   */
  sortStories(stories, sortBy = "createdAt", sortOrder = "asc") {
    const sorted = [...stories];
    sorted.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  },

  /**
   * Paginate stories
   */
  paginateStories(stories, page = 1, limit = 10) {
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: stories.slice(start, end),
      total: stories.length,
      page,
      limit,
      pages: Math.ceil(stories.length / limit),
    };
  },
};

// ========================
// UNIT TESTS
// ========================

async function runStoryServiceUnitTests() {
  const report = new TestReport("Story Service Unit Tests");
  
  // Use fresh stories with correct reading levels (fix mutation issue from integration tests)
  const stories = [
    {
      _id: "60d5ec49f1c1b0001f5a0001",
      title: "The Cat in the Moon",
      author: "John Smith",
      description: "A magical tale of a curious cat",
      ageGroup: ["4-6", "7-9"],
      genres: ["fantasy", "adventure"],
      readingLevel: "beginner",
      coverImage: "https://example.com/cover1.jpg",
      content: "Once upon a time, there was a cat...",
      pageCount: 45,
      source: "internal",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      _id: "60d5ec49f1c1b0001f5a0002",
      title: "Adventure in the Enchanted Forest",
      author: "Sarah Johnson",
      description: "Kids explore a magical forest",
      ageGroup: ["7-9", "10-12"],
      genres: ["science-fiction", "adventure"],
      readingLevel: "intermediate",
      coverImage: "https://example.com/cover2.jpg",
      content: "Three friends entered the forest...",
      pageCount: 125,
      source: "google-books",
      googleBooksId: "gb123456",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      _id: "60d5ec49f1c1b0001f5a0003",
      title: "The Space Adventure",
      author: "Tom Wilson",
      description: "A journey through the galaxy",
      ageGroup: ["10-12", "13-15"],
      genres: ["fantasy", "mystery"],
      readingLevel: "advanced",
      coverImage: "https://example.com/cover3.jpg",
      content: "Captain Nova launched into space...",
      pageCount: 200,
      source: "internal",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
    },
  ];

  // Test 1: Filter by Age Group
  try {
    const result = mockStoryService.filterByAgeGroup(stories, "7-9");
    report.logAssertion("Filter stories by age group", result.length === 2);
  } catch (error) {
    report.logAssertion("Filter stories by age group", false);
  }

  // Test 2: Filter by Genre
  try {
    const result = mockStoryService.filterByGenre(stories, "fantasy");
    report.logAssertion("Filter stories by genre", result.length === 2);
  } catch (error) {
    report.logAssertion("Filter stories by genre", false);
  }

  // Test 3: Filter by Reading Level
  try {
    const result = mockStoryService.filterByReadingLevel(stories, "intermediate");
    report.logAssertion("Filter stories by reading level", result.length === 1);
  } catch (error) {
    report.logAssertion("Filter stories by reading level", false);
  }

  // Test 4: Search Stories
  try {
    const result = mockStoryService.searchStories(stories, "Cat");
    report.logAssertion(
      "Search stories by title",
      result.length === 1 && result[0].title.includes("Cat")
    );
  } catch (error) {
    report.logAssertion("Search stories by title", false);
  }

  // Test 5: Search Stories by Author
  try {
    const result = mockStoryService.searchStories(stories, "John");
    report.logAssertion(
      "Search stories by author",
      result.length > 0 && result[0].author.includes("John")
    );
  } catch (error) {
    report.logAssertion("Search stories by author", false);
  }

  // Test 6: Validate Valid Story Data
  try {
    const validStory = {
      title: "Test Story",
      author: "Test Author",
      ageGroup: ["7-9"],
      genres: ["adventure"],
      readingLevel: "beginner",
      description: "This is a valid story description",
    };
    const validation = mockStoryService.validateStoryData(validStory);
    report.logAssertion("Validate valid story data", validation.isValid === true);
  } catch (error) {
    report.logAssertion("Validate valid story data", false);
  }

  // Test 7: Validate Invalid Story Data (Missing Title)
  try {
    const invalidStory = {
      author: "Test Author",
      ageGroup: ["7-9"],
      genres: ["adventure"],
      readingLevel: "beginner",
      description: "This is a valid story description",
    };
    const validation = mockStoryService.validateStoryData(invalidStory);
    report.logAssertion(
      "Reject invalid story data (missing title)",
      validation.isValid === false && validation.errors.length > 0
    );
  } catch (error) {
    report.logAssertion("Reject invalid story data (missing title)", false);
  }

  // Test 8: Validate Invalid Story Data (Short Description)
  try {
    const invalidStory = {
      title: "Test Story",
      author: "Test Author",
      ageGroup: ["7-9"],
      genres: ["adventure"],
      readingLevel: "beginner",
      description: "Too short",
    };
    const validation = mockStoryService.validateStoryData(invalidStory);
    report.logAssertion(
      "Reject invalid story data (short description)",
      validation.isValid === false && validation.errors.length > 0
    );
  } catch (error) {
    report.logAssertion("Reject invalid story data (short description)", false);
  }

  // Test 9: Calculate Reading Level Score
  try {
    const beginnerScore = mockStoryService.calculateReadingLevelScore("beginner");
    const intermediateScore = mockStoryService.calculateReadingLevelScore("intermediate");
    const advancedScore = mockStoryService.calculateReadingLevelScore("advanced");
    report.logAssertion(
      "Calculate reading level scores",
      beginnerScore === 1 && intermediateScore === 2 && advancedScore === 3
    );
  } catch (error) {
    report.logAssertion("Calculate reading level scores", false);
  }

  // Test 10: Check Duplicate Stories
  try {
    const newDuplicate = {
      title: "The Cat in the Moon",
      author: "John Smith",
      description: "Different description",
    };
    const isDuplicate = mockStoryService.checkDuplicate(stories, newDuplicate);
    report.logAssertion("Detect duplicate story", isDuplicate === true);
  } catch (error) {
    report.logAssertion("Detect duplicate story", false);
  }

  // Test 11: Check Non-Duplicate Stories
  try {
    const newUnique = {
      title: "Unique Story Title",
      author: "Unique Author",
      description: "This is unique",
    };
    const isDuplicate = mockStoryService.checkDuplicate(stories, newUnique);
    report.logAssertion("Allow unique story", isDuplicate === false);
  } catch (error) {
    report.logAssertion("Allow unique story", false);
  }

  // Test 12: Sort Stories by Title (Ascending)
  try {
    const sorted = mockStoryService.sortStories(stories, "title", "asc");
    report.logAssertion(
      "Sort stories by title (ascending)",
      sorted[0].title < sorted[1].title
    );
  } catch (error) {
    report.logAssertion("Sort stories by title (ascending)", false);
  }

  // Test 13: Sort Stories by Title (Descending)
  try {
    const sorted = mockStoryService.sortStories(stories, "title", "desc");
    report.logAssertion(
      "Sort stories by title (descending)",
      sorted[0].title > sorted[1].title
    );
  } catch (error) {
    report.logAssertion("Sort stories by title (descending)", false);
  }

  // Test 14: Paginate Stories
  try {
    const paginated = mockStoryService.paginateStories(stories, 1, 2);
    report.logAssertion(
      "Paginate stories correctly",
      paginated.data.length === 2 && paginated.total === 3 && paginated.pages === 2
    );
  } catch (error) {
    report.logAssertion("Paginate stories correctly", false);
  }

  // Test 15: Paginate Stories - Second Page
  try {
    const paginated = mockStoryService.paginateStories(stories, 2, 2);
    report.logAssertion(
      "Paginate second page",
      paginated.data.length === 1 && paginated.page === 2
    );
  } catch (error) {
    report.logAssertion("Paginate second page", false);
  }

  // Test 16: Filter Invalid Input (null stories)
  try {
    mockStoryService.filterByAgeGroup(null, "7-9");
    report.logAssertion("Reject null stories input", false);
  } catch (error) {
    report.logAssertion("Reject null stories input", error instanceof Error);
  }

  // Test 17: Search with Empty Query
  try {
    mockStoryService.searchStories(stories, "");
    report.logAssertion("Reject empty search query", false);
  } catch (error) {
    report.logAssertion("Reject empty search query", error instanceof Error);
  }

  // Test 18: Chained Filters (Age Group + Genre)
  try {
    let filtered = mockStoryService.filterByAgeGroup(stories, "7-9");
    filtered = mockStoryService.filterByGenre(filtered, "fantasy");
    report.logAssertion(
      "Apply chained filters",
      filtered.length === 1 &&
        filtered[0].ageGroup.includes("7-9") &&
        filtered[0].genres.includes("fantasy")
    );
  } catch (error) {
    report.logAssertion("Apply chained filters", false);
  }

  report.print();
  return report.summary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const summary = await runStoryServiceUnitTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { runStoryServiceUnitTests, mockStoryService };


test('runStoryServiceUnitTests', async () => { 
  await runStoryServiceUnitTests(); 
});
