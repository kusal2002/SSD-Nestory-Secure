const Story = require("../../models/storyLibrary/Story");
const googleBooksService = require("./googleBooksService");

const syncGoogleMetadata = async (storyId) => {
  const story = await Story.findById(storyId);

  if (!story) {
    throw new Error("Story not found");
  }

  if (story.source !== "google") {
    throw new Error("Only Google imported stories can be synced");
  }

  if (!story.googleBookId) {
    throw new Error("No Google Book ID found for this story");
  }

  // Fetch fresh data from Google
  const googleData = await googleBooksService.getBookById(
    story.googleBookId
  );

  if (!googleData) {
    throw new Error("Unable to fetch metadata from Google");
  }

  // Update only metadata fields
  story.title = googleData.title || story.title;
  story.author = googleData.author || story.author;
  story.description = googleData.description || story.description;
  story.coverImage = googleData.coverImage || story.coverImage;
  story.previewLink = googleData.previewLink || story.previewLink;

  await story.save();

  return story;
};

module.exports = { syncGoogleMetadata };