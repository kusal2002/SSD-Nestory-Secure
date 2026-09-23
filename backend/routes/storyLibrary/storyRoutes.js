const express = require('express');
const router = express.Router();

const { protect, admin } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');
const storyController = require('../../controllers/storyLibrary/storyController');
const storySyncController = require('../../controllers/storyLibrary/storySyncController');
const storyQueryController = require("../../controllers/storyLibrary/storyQueryController");
const { checkStoryAccess } = require('../../controllers/storyLibrary/storyAccessController');

//Public: Google 
// GET /api/stories/search?q=harry%20potter
router.get('/google/search', storyController.searchExternalBooks);

//Google (admin)
//POST /api/stories/google/import/:googleBookId
router.post('/google/import/:googleBookId', protect, admin, storyController.importGoogleBook);

//PUT /api/stories/google/sync/:id
// PUT /api/stories/google/sync/:storyId
router.put('/google/sync/:storyId', protect, admin, storySyncController.syncStoryMetadata);

//Public
router.get('/', protect, storyController.getStories);
router.get('/:id', storyController.getStoryById);
// Age restriction check (Child age vs Story ageGroup)
router.get('/:storyId/access/:childId', protect, checkStoryAccess);

//Admin
router.post('/', protect, admin, upload.single('pdf'), storyController.createStory);
router.put('/:id', protect, admin, upload.single('pdf'), storyController.updateStory);
router.delete('/:id', protect, admin, storyController.deleteStory);

module.exports = router;