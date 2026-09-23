const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  createSearchRequest,
  getPendingRequests,
  markReviewing,
  ignoreRequest,
} = require('../controllers/searchRequestController');

router.post('/', protect, createSearchRequest);
router.get('/pending', protect, getPendingRequests);
router.put('/:id/reviewing', protect, markReviewing);
router.put('/:id/ignore', protect, ignoreRequest);

module.exports = router;