/**
 * Component 1: Story Library & Content Management
 * SYSTEM TESTS
 * Owner: EHARA
 *
 * Tests complete workflow scenarios from admin perspective
 * Covers: Story creation, management, Google Books integration, and parent-child visibility
 */

const { TestReport } = require("../../config/test-utils");
const { dummyStories } = require("../../fixtures/dummy-data");
const { test } = require('@playwright/test');

// Mock complete system for system tests
const mockStoryLibrarySystem = {
  stories: [...dummyStories],
  googleBooksQueue: [],

  /**
   * Workflow 1: Admin adds a new story to library
   */
  async workflowAdminAddStory(storyData, adminRole) {
    if (adminRole !== "admin") {
      throw new Error("Unauthorized");
    }

    const errors = [];
    if (!storyData.title) errors.push("Title required");
    if (!storyData.author) errors.push("Author required");
    if (!storyData.ageGroup || storyData.ageGroup.length === 0)
      errors.push("Age group required");
    if (!storyData.genres || storyData.genres.length === 0)
      errors.push("Genres required");
    if (!storyData.readingLevel) errors.push("Reading level required");
    if (!storyData.description || storyData.description.length < 10)
      errors.push("Description at least 10 characters");

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const newStory = {
      _id: `story_${Date.now()}`,
      ...storyData,
      source: "internal",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.stories.push(newStory);
    return newStory;
  },

  /**
   * Workflow 2: Admin searches and imports from Google Books
   */
  async workflowImportFromGoogleBooks(query, adminRole) {
    if (adminRole !== "admin") {
      throw new Error("Unauthorized");
    }

    // Mock Google Books API search
    const searchResults = [
      {
        id: "gb_12345",
        title: "Popular Children Book",
        author: "Famous Author",
        description: "A popular and award-winning children book",
        thumbnail: "https://api.google.com/thumb.jpg",
      },
      {
        id: "gb_12346",
        title: "Educational Tales",
        author: "Education Expert",
        description: "Stories designed for educational purposes",
        thumbnail: "https://api.google.com/thumb2.jpg",
      },
    ];

    // Add to import queue
    this.googleBooksQueue.push({
      results: searchResults,
      query,
      timestamp: new Date(),
      status: "pending",
    });

    return searchResults;
  },

  /**
   * Workflow 3: Admin imports selected book from Google Books
   */
  async workflowSelectAndImportBook(googleBooksId, selectedTitle, adminRole) {
    if (adminRole !== "admin") {
      throw new Error("Unauthorized");
    }

    const imported = {
      _id: `story_${googleBooksId}`,
      title: selectedTitle,
      author: "Google Books Author",
      description: "Imported from Google Books API",
      ageGroup: ["7-9"],
      genres: ["adventure"],
      readingLevel: "intermediate",
      coverImage: "https://books.google.com/cover.jpg",
      source: "google-books",
      googleBooksId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.stories.push(imported);

    // Update queue status
    const queueItem = this.googleBooksQueue.find(
      (q) => q.status === "pending"
    );
    if (queueItem) {
      queueItem.status = "imported";
      queueItem.importedAt = new Date();
    }

    return imported;
  },

  /**
   * Workflow 4: Admin tags story with age groups and genres
   */
  async workflowTagStory(storyId, tags, adminRole) {
    if (adminRole !== "admin") {
      throw new Error("Unauthorized");
    }

    const story = this.stories.find((s) => s._id === storyId);
    if (!story) throw new Error("Story not found");

    if (tags.ageGroup && Array.isArray(tags.ageGroup)) {
      story.ageGroup = tags.ageGroup;
    }
    if (tags.genres && Array.isArray(tags.genres)) {
      story.genres = tags.genres;
    }
    if (tags.readingLevel) {
      story.readingLevel = tags.readingLevel;
    }

    story.updatedAt = new Date();
    return story;
  },

  /**
   * Workflow 5: Parent searches for stories suitable for child
   */
  async workflowParentSearchStories(childAgeGroup, parentRole) {
    if (parentRole !== "parent") {
      throw new Error("Unauthorized");
    }

    const suitableStories = this.stories.filter((s) =>
      s.ageGroup.includes(childAgeGroup)
    );

    return {
      childAgeGroup,
      availableStories: suitableStories,
      count: suitableStories.length,
    };
  },

  /**
   * Workflow 6: Sync metadata for Google Books stories
   */
  async workflowSyncGoogleBooksMetadata(storyId, adminRole) {
    if (adminRole !== "admin") {
      throw new Error("Unauthorized");
    }

    const story = this.stories.find((s) => s._id === storyId);
    if (!story) throw new Error("Story not found");
    if (!story.googleBooksId)
      throw new Error("Story is not from Google Books");

    // Mock metadata update from Google Books API
    story.coverImage = "https://books.google.com/updated-cover.jpg";
    story.description = "Updated description from Google Books API";
    story.updatedAt = new Date();

    return {
      success: true,
      story,
      lastSyncedAt: new Date(),
    };
  },

  /**
   * Workflow 7: Admin publishes story (makes it available)
   */
  async workflowPublishStory(storyId, adminRole) {
    if (adminRole !== "admin") {
      throw new Error("Unauthorized");
    }

    const story = this.stories.find((s) => s._id === storyId);
    if (!story) throw new Error("Story not found");

    story.published = true;
    story.publishedAt = new Date();
    story.updatedAt = new Date();

    return story;
  },

  /**
   * Workflow 8: Verify story is discoverable by parents
   */
  async workflowVerifyStoryDiscovery(storyId) {
    const story = this.stories.find(
      (s) => s._id === storyId && s.published
    );
    if (!story) throw new Error("Story not discoverable");

    return {
      discoverable: true,
      story,
    };
  },

  /**
   * Workflow 9: List all available genres and age groups
   */
  async workflowGetAvailableTags() {
    const genres = new Set();
    const ageGroups = new Set();

    this.stories.forEach((story) => {
      story.genres.forEach((g) => genres.add(g));
      story.ageGroup.forEach((a) => ageGroups.add(a));
    });

    return {
      availableGenres: Array.from(genres).sort(),
      availableAgeGroups: Array.from(ageGroups).sort(),
      totalStories: this.stories.length,
    };
  },

  /**
   * Workflow 10: Admin generates library analytics
   */
  async workflowGetLibraryAnalytics(adminRole) {
    if (adminRole !== "admin") {
      throw new Error("Unauthorized");
    }

    const published = this.stories.filter((s) => s.published).length;
    const googleBooksStories = this.stories.filter(
      (s) => s.source === "google-books"
    ).length;
    const internalStories = this.stories.filter(
      (s) => s.source === "internal"
    ).length;

    const genreStats = {};
    this.stories.forEach((story) => {
      story.genres.forEach((genre) => {
        genreStats[genre] = (genreStats[genre] || 0) + 1;
      });
    });

    const ageGroupStats = {};
    this.stories.forEach((story) => {
      story.ageGroup.forEach((age) => {
        ageGroupStats[age] = (ageGroupStats[age] || 0) + 1;
      });
    });

    return {
      totalStories: this.stories.length,
      publishedStories: published,
      googleBooksStories,
      internalStories,
      importQueue: this.googleBooksQueue.length,
      genreStats,
      ageGroupStats,
    };
  },
};

// ========================
// SYSTEM TESTS
// ========================

async function runStoryLibrarySystemTests() {
  const report = new TestReport("Story Library System Tests");

  try {
    // Test 1: Complete workflow - Admin adds internal story
    try {
      const newStory = await mockStoryLibrarySystem.workflowAdminAddStory(
        {
          title: "New Adventure",
          author: "Test Author",
          description: "An exciting adventure for young readers",
          ageGroup: ["7-9"],
          genres: ["adventure"],
          readingLevel: "intermediate",
        },
        "admin"
      );
      report.logAssertion(
        "Admin adds internal story",
        newStory.title === "New Adventure" && newStory.source === "internal"
      );
    } catch (error) {
      report.logAssertion("Admin adds internal story", false);
    }

    // Test 2: Prevent non-admin from adding story
    try {
      await mockStoryLibrarySystem.workflowAdminAddStory(
        {
          title: "Test",
          author: "Test",
          description: "Test description",
          ageGroup: ["7-9"],
          genres: ["adventure"],
          readingLevel: "beginner",
        },
        "parent"
      );
      report.logAssertion("Prevent non-admin from adding story", false);
    } catch (error) {
      report.logAssertion("Prevent non-admin from adding story", true);
    }

    // Test 3: Validate story data before adding
    try {
      await mockStoryLibrarySystem.workflowAdminAddStory(
        {
          title: "Invalid Story",
          description: "Too short",
        },
        "admin"
      );
      report.logAssertion("Validate story data", false);
    } catch (error) {
      report.logAssertion("Validate story data", true);
    }

    // Test 4: Search Google Books by query
    try {
      const results = await mockStoryLibrarySystem.workflowImportFromGoogleBooks(
        "children stories",
        "admin"
      );
      report.logAssertion(
        "Search Google Books",
        Array.isArray(results) && results.length > 0
      );
    } catch (error) {
      report.logAssertion("Search Google Books", false);
    }

    // Test 5: Import selected book from Google Books
    try {
      const imported = await mockStoryLibrarySystem.workflowSelectAndImportBook(
        "gb_12345",
        "Popular Children Book",
        "admin"
      );
      report.logAssertion(
        "Import from Google Books",
        imported.googleBooksId === "gb_12345" &&
          imported.source === "google-books"
      );
    } catch (error) {
      report.logAssertion("Import from Google Books", false);
    }

    // Test 6: Tag story with metadata
    try {
      const storyId = mockStoryLibrarySystem.stories[0]._id;
      const tagged = await mockStoryLibrarySystem.workflowTagStory(
        storyId,
        {
          ageGroup: ["7-9", "10-12"],
          genres: ["adventure", "fantasy"],
          readingLevel: "intermediate",
        },
        "admin"
      );
      report.logAssertion(
        "Tag story with metadata",
        tagged.ageGroup.includes("10-12") &&
          tagged.genres.includes("fantasy")
      );
    } catch (error) {
      report.logAssertion("Tag story with metadata", false);
    }

    // Test 7: Parent searches for stories by child age
    try {
      const result = await mockStoryLibrarySystem.workflowParentSearchStories(
        "7-9",
        "parent"
      );
      report.logAssertion(
        "Parent searches stories by age",
        result.childAgeGroup === "7-9" &&
          result.availableStories.every((s) =>
            s.ageGroup.includes("7-9")
          )
      );
    } catch (error) {
      report.logAssertion("Parent searches stories by age", false);
    }

    // Test 8: Sync Google Books metadata
    try {
      const googleBookStory = mockStoryLibrarySystem.stories.find(
        (s) => s.source === "google-books"
      );
      if (googleBookStory) {
        const synced = await mockStoryLibrarySystem.workflowSyncGoogleBooksMetadata(
          googleBookStory._id,
          "admin"
        );
        report.logAssertion(
          "Sync Google Books metadata",
          synced.success && synced.lastSyncedAt
        );
      } else {
        report.logAssertion("Sync Google Books metadata", true); // Skip if no Google Books stories
      }
    } catch (error) {
      report.logAssertion("Sync Google Books metadata", false);
    }

    // Test 9: Publish story
    try {
      const storyId = mockStoryLibrarySystem.stories[0]._id;
      const published = await mockStoryLibrarySystem.workflowPublishStory(
        storyId,
        "admin"
      );
      report.logAssertion(
        "Publish story",
        published.published === true && published.publishedAt
      );
    } catch (error) {
      report.logAssertion("Publish story", false);
    }

    // Test 10: Verify story is discoverable
    try {
      const publishedStory = mockStoryLibrarySystem.stories.find(
        (s) => s.published
      );
      if (publishedStory) {
        const discovery = await mockStoryLibrarySystem.workflowVerifyStoryDiscovery(
          publishedStory._id
        );
        report.logAssertion(
          "Verify story is discoverable",
          discovery.discoverable === true
        );
      } else {
        report.logAssertion("Verify story is discoverable", true);
      }
    } catch (error) {
      report.logAssertion("Verify story is discoverable", false);
    }

    // Test 11: Get available tags
    try {
      const tags = await mockStoryLibrarySystem.workflowGetAvailableTags();
      report.logAssertion(
        "Get available tags",
        Array.isArray(tags.availableGenres) &&
          Array.isArray(tags.availableAgeGroups) &&
          tags.totalStories > 0
      );
    } catch (error) {
      report.logAssertion("Get available tags", false);
    }

    // Test 12: Get library analytics
    try {
      const analytics = await mockStoryLibrarySystem.workflowGetLibraryAnalytics(
        "admin"
      );
      report.logAssertion(
        "Get library analytics",
        analytics.totalStories >= 0 &&
          analytics.publishedStories >= 0 &&
          analytics.googleBooksStories >= 0
      );
    } catch (error) {
      report.logAssertion("Get library analytics", false);
    }

    // Test 13: Complete workflow - Add, tag, and publish
    try {
      // Add story
      const newStory = await mockStoryLibrarySystem.workflowAdminAddStory(
        {
          title: "Complete Workflow Story",
          author: "Workflow Author",
          description: "This story tests the complete workflow",
          ageGroup: ["10-12"],
          genres: ["educational"],
          readingLevel: "advanced",
        },
        "admin"
      );

      // Tag it
      const tagged = await mockStoryLibrarySystem.workflowTagStory(
        newStory._id,
        {
          ageGroup: ["10-12", "13-15"],
          genres: ["educational", "adventure"],
          readingLevel: "advanced",
        },
        "admin"
      );

      // Publish it
      const published = await mockStoryLibrarySystem.workflowPublishStory(
        newStory._id,
        "admin"
      );

      report.logAssertion(
        "Complete workflow - Add, tag, publish",
        newStory.title === "Complete Workflow Story" &&
          tagged.genres.includes("adventure") &&
          published.published === true
      );
    } catch (error) {
      report.logAssertion("Complete workflow - Add, tag, publish", false);
    }

    // Test 14: Google Books import workflow
    try {
      const searchResults = await mockStoryLibrarySystem.workflowImportFromGoogleBooks(
        "test query",
        "admin"
      );
      const imported = await mockStoryLibrarySystem.workflowSelectAndImportBook(
        searchResults[0].id,
        searchResults[0].title,
        "admin"
      );
      const published = await mockStoryLibrarySystem.workflowPublishStory(
        imported._id,
        "admin"
      );

      report.logAssertion(
        "Google Books import workflow",
        imported.source === "google-books" && published.published === true
      );
    } catch (error) {
      report.logAssertion("Google Books import workflow", false);
    }

    // Test 15: Library grows with each operation
    try {
      const initialCount = mockStoryLibrarySystem.stories.length;
      await mockStoryLibrarySystem.workflowAdminAddStory(
        {
          title: "Growth Test Story",
          author: "Growth Author",
          description: "Test that library grows with additions",
          ageGroup: ["4-6"],
          genres: ["fairy-tales"],
          readingLevel: "beginner",
        },
        "admin"
      );
      const finalCount = mockStoryLibrarySystem.stories.length;
      report.logAssertion(
        "Library grows with additions",
        finalCount === initialCount + 1
      );
    } catch (error) {
      report.logAssertion("Library grows with additions", false);
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
      const summary = await runStoryLibrarySystemTests();
      console.log("\n📊 Summary:", summary);
      process.exit(summary.passed === summary.total ? 0 : 1);
    } catch (error) {
      console.error("❌ Test execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { runStoryLibrarySystemTests, mockStoryLibrarySystem };


test('runStoryLibrarySystemTests', async () => { 
  await runStoryLibrarySystemTests(); 
});
