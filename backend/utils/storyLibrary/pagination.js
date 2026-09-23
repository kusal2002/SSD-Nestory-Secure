const { PAGINATION } = require("../../constants");

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE, 1);
  const limitRaw = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
  const limit = Math.min(Math.max(limitRaw, 1), PAGINATION.MAX_LIMIT);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = { getPagination };