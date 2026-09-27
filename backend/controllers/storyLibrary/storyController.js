const mongoose = require('mongoose');
const successResponse = require('../../utils/responseFormatter');
const { searchGoogleBooks } = require('../../services/storyLibrary/googleBooksService');
const storyService = require('../../services/storyLibrary/storyService');

// Permitted fields allow-list to prevent Mass Assignment vulnerabilities (CWE-915)
const ALLOWED_STORY_FIELDS = [
    'title',
    'author',
    'description',
    'ageGroup',
    'genres',
    'readingLevel',
    'coverImage',
    'previewLink',
    'pageCount'
];

const sanitizeStoryPayload = (body) => {
    const sanitized = {};
    if (!body || typeof body !== 'object') return sanitized;
    for (const field of ALLOWED_STORY_FIELDS) {
        if (body[field] !== undefined) {
            sanitized[field] = body[field];
        }
    }
    return sanitized;
};


exports.searchExternalBooks = async (req, res, next) => {
    try {
        const q = req.query.q;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter "q" is required'
            });
        }

        const results = await searchGoogleBooks(q);
        return successResponse(res, 200, 'Google Books results fetched', results);
    } catch (err) {
        next(err);
    }
};

//GET /api/stories
exports.getStories = async (req, res, next) => {
    try {
        const result = await storyService.listStories(req.query, req.user);
        return successResponse(res, 200, 'Stories fetched successfully', result);
    } catch (err) {
        next(err);
    }
};

//GET /api/stories/:id
exports.getStoryById = async (req, res, next) => {
    try {
        const story = await storyService.getStoryById(req.params.id);
        if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

        const plain = story.toObject ? story.toObject() : { ...story };
        const gid = plain.googleBookId && String(plain.googleBookId).trim();
        if (gid && !String(plain.previewLink || '').trim()) {
            plain.previewLink = `https://books.google.com/books?id=${encodeURIComponent(gid)}&printsec=frontcover`;
        }

        return successResponse(res, 200, 'Story fetched successfully', plain);
    } catch (err) {
        next(err);
    }
};

//POST /api/stories (admin)
exports.createStory = async (req, res, next) => {
    try {
        // Whitelist permitted fields to prevent Mass Assignment (CWE-915)
        const payload = sanitizeStoryPayload(req.body);
        
        // Handle file upload
        if (req.file) {
            payload.pdfUrl = `/api/uploads/pdf/${req.file.filename}`;
        }

        // createdBy is strictly enforced from req.user._id, preventing ownership spoofing
        const story = await storyService.createStory(payload, req.user._id);
        return successResponse(res, 201, 'Story created successfully', story);
    } catch (err) {
        next(err);
    }
};

//PUT /api/stories/:id (admin)
exports.updateStory = async (req, res, next) => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid story ID format' });
        }

        // Whitelist permitted fields to prevent Mass Assignment (CWE-915)
        const payload = sanitizeStoryPayload(req.body);
        
        // Handle file upload
        if (req.file) {
            payload.pdfUrl = `/api/uploads/pdf/${req.file.filename}`;
        }

        const story = await storyService.updateStory(req.params.id, payload);
        if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

        return successResponse(res, 200, 'Story updated successfully', story);
    } catch (err) {
        next(err);
    }
};

//DELETE /api/stories/:id (admin)
exports.deleteStory = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid story ID format' });
        }

        const story = await storyService.deleteStory(req.params.id);
        if (!story) return res.status(404).json({ success:false, message: 'Story not found' });

        return successResponse(res, 200, 'Story deleted successfully');
    } catch (err) {
        next(err);
    }
};

//POST /api/stories/import/:googleBookId (admin)
exports.importGoogleBook = async (req, res, next) => {
    try {
        const { googleBookId } = req.params;
        const { ageGroup, genres, readingLevel } = req.body;

        if (!ageGroup || !genres || !Array.isArray(genres) || genres.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'ageGroup and genres[] are required for import'
            });
        }
        const story = await storyService.importGoogleBook(
            googleBookId,
            { ageGroup, genres, readingLevel },
            req.user._id
        );
        
        return successResponse(res, 201, 'Google book imported successfully', story);
    } catch (err) {
        next(err);
    }
};

//PUT /api/stories/google/sync/:id (admin)
exports.syncGoogleStory = async (req, res, next) => {
    try {
        const updated = await storyService.syncGoogleMetadata(req.params.id);
        return successResponse(res, 200, 'Google metadata synced successfully', updated);
    } catch (err) {
        next(err);
    }
};