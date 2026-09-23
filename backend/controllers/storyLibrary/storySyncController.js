const storySyncService = require("../../services/storyLibrary/storySyncService");

exports.syncStoryMetadata = async (req, res) => {
  try {
    const updatedStory = await storySyncService.syncGoogleMetadata(
      req.params.storyId
    );

    return res.status(200).json({
      success: true,
      message: "Google metadata synced successfully",
      data: updatedStory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};