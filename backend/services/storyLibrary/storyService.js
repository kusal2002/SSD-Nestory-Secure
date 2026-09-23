const Story = require('../../models/storyLibrary/Story');
const Child = require('../../models/Child');
const { getGoogleBookById } = require('./googleBooksService');

const mapAgeToGroup = (age) => {
    if (age <= 5) return 'toddler';
    if (age <= 8) return 'early-reader';
    if (age <= 12) return 'middle-grade';
    return 'young-adult';
};

exports.listStories = async (query, user) => {
    const { page = 1, limit = 10, search, ageGroup, genre, readingLevel, source } = query;

    const filter = {};

    if (user && user.role === 'child') {
        const child = await Child.findById(user.id || user._id);

        if (child) {
            filter.ageGroup = mapAgeToGroup(child.age);
        } else if (ageGroup) {
            filter.ageGroup = ageGroup;
        }
    } else if (user && user.ageGroup) {
        filter.ageGroup = user.ageGroup;
    } else if (ageGroup) {
        filter.ageGroup = ageGroup;
    }

    if (readingLevel) filter.readingLevel = readingLevel;
    if (source) filter.source = source;
    if (genre) filter.genres = { $in: [genre] };

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [stories, total] = await Promise.all([
        Story.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Story.countDocuments(filter)
    ]);

    return {
        stories,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
    };
};

exports.getStoryById = async (id) => {
    return Story.findById(id);
};

exports.createStory = async (payload, userId) => {
    return Story.create({
        ...payload,
        createdBy: userId,
        source: 'internal'
    });
};

exports.updateStory = async (id, payload) => {
    return Story.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

exports.deleteStory = async (id) => {
    return Story.findByIdAndDelete(id);
};

// import Google Book into DB (Admin)
exports.importGoogleBook = async (googleBookId, defaults, userId) => {
    const meta = await getGoogleBookById(googleBookId);

    const exists = await Story.findOne({ googleBookId });
    if (exists) {
        const err = new Error('This Google book has already been imported');
        err.statusCode = 400;
        throw err;
    }

    const story = await Story.create({
        title: meta.title,
        author: meta.author,
        description: meta.description,
        coverImage: meta.coverImage,
        previewLink: meta.previewLink,
        pageCount: meta.pageCount || 0,
        googleBookId: meta.googleBookId,
        source: 'google',

        ageGroup: defaults.ageGroup,
        genres: defaults.genres,
        readingLevel: defaults.readingLevel || 'intermediate',

        createdBy: userId
    });

    return story;
};

// Sync Google metadata for an imported story (Admin)
exports.syncGoogleMetadata = async (storyId) => {
    const story = await Story.findById(storyId);
    if (!story) {
        const err = new Error('Story not found');
        err.statusCode = 404;
        throw err;
    }

    if (!story.googleBookId) {
        const err = new Error('This story has no GoogleBookID to sync');
        err.statusCode = 400;
        throw err;
    }

    const meta = await getGoogleBookById(story.googleBookId);

    story.title = meta.title;
    story.author = meta.author;
    story.description = meta.description;
    story.coverImage = meta.coverImage;
    story.previewLink = meta.previewLink;
    story.pageCount = meta.pageCount || story.pageCount || 0;

    const updated = await story.save();
    return updated;
};

// ========================
// FILTERING UTILITIES
// ========================

/**
 * Filter stories by reading level
 */
exports.filterByReadingLevel = (stories, level) => {
    if (!Array.isArray(stories)) return [];
    if (!level) return stories;
    return stories.filter(story => story.readingLevel === level);
};

/**
 * Filter stories by age group
 */
exports.filterByAgeGroup = (stories, ageGroup) => {
    if (!Array.isArray(stories)) return [];
    if (!ageGroup) return stories;
    return stories.filter(story => 
        story.ageGroup && (story.ageGroup.includes(ageGroup) || Array.isArray(story.ageGroup) && story.ageGroup.includes(ageGroup))
    );
};

/**
 * Filter stories by genre
 */
exports.filterByGenre = (stories, genre) => {
    if (!Array.isArray(stories)) return [];
    if (!genre) return stories;
    return stories.filter(story => 
        Array.isArray(story.genres) && story.genres.includes(genre)
    );
};

/**
 * Filter stories by source
 */
exports.filterBySource = (stories, source) => {
    if (!Array.isArray(stories)) return [];
    if (!source) return stories;
    return stories.filter(story => story.source === source);
};