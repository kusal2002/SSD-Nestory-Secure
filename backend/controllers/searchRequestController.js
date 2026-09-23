const SearchRequest = require('../models/SearchRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIo } = require('../realtime/socketServer');
const { notifyAdmins } = require('../utils/notificationHelper');

exports.createSearchRequest = async (req, res) => {
  try {
    if (req.user?.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Only child users can create search requests',
      });
    }

    const { query, suggestedBookName, googleBookId, author, coverImage, previewLink, pageCount } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const request = await SearchRequest.create({
      requesterUserId: req.user._id,
      requesterName: req.user.name || 'Child',
      query: query.trim(),
      suggestedBookName: suggestedBookName || query.trim(),
      googleBookId: googleBookId || '',
      author: author || '',
      coverImage: coverImage || '',
      previewLink: previewLink || '',
      pageCount: Number(pageCount || 0),
    });

    // Create notification for admins using helper
    await notifyAdmins({
        sender: req.user._id,
        type: 'search_request',
        title: 'New Book Request',
        message: `${req.user.name || 'A child'} has requested a new book: ${suggestedBookName || query}`,
        data: {
            requestId: request._id,
            bookName: suggestedBookName || query,
            author: author || ''
        }
    });

    return res.status(201).json({
      success: true,
      message: 'Search request created',
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create search request',
    });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view search requests',
      });
    }

    const requests = await SearchRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load search requests',
    });
  }
};

exports.markReviewing = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can review search requests',
      });
    }

    const request = await SearchRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'reviewing' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Search request not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Search request marked for review',
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update search request',
    });
  }
};

exports.ignoreRequest = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can ignore search requests',
      });
    }

    const request = await SearchRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'ignored' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Search request not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Search request ignored',
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to ignore search request',
    });
  }
};