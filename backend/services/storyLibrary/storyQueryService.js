const Story = require("../../models/storyLibrary/Story");
const { getPagination } = require("../../utils/storyLibrary/pagination");

const buildStoryFilter = (query) => {
  const filter = {};

  // filters
  if (query.ageGroup) filter.ageGroup = query.ageGroup;
  if (query.readingLevel) filter.readingLevel = query.readingLevel;
  if (query.source) filter.source = query.source;

  // genre filter (your schema uses genres: [String])
  if (query.genre) filter.genres = { $in: [query.genre] };

  // search (uses your text index)
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
};

const buildSort = (query) => {
  // default: latest first
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  // If using text search, Mongo gives textScore
  if (query.search) {
    return { score: { $meta: "textScore" }, createdAt: -1 };
  }

  return { [sortBy]: sortOrder };
};

const getStoriesWithQuery = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = buildStoryFilter(query);
  const sort = buildSort(query);

  const findQuery = Story.find(filter).sort(sort).skip(skip).limit(limit);

  // If search is active, project score so sort works nicely
  if (query.search) {
    findQuery.select({ score: { $meta: "textScore" } });
  }

  const [stories, total] = await Promise.all([
    findQuery,
    Story.countDocuments(filter),
  ]);

  return {
    stories,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = { getStoriesWithQuery };