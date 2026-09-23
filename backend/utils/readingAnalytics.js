/**
 * Pure helpers for reading progress & streak analytics (easy to unit test).
 */

const getDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * @param {number} pagesRead
 * @param {number} totalPages
 * @returns {number} 0–100, two decimal places
 */
const readingProgressPercentRounded = (pagesRead, totalPages) => {
  if (!totalPages || totalPages <= 0) return 0;
  const pct = (Number(pagesRead) / Number(totalPages)) * 100;
  return Number(pct.toFixed(2));
};

/**
 * Current streak ending on the most recent day in the set (sorted ascending day keys).
 * @param {number[]} sortedAscDayKeysMs — midnight UTC-ms, ascending
 */
const currentStreakFromSortedDayKeys = (sortedAscDayKeysMs) => {
  if (!sortedAscDayKeysMs.length) return 0;
  let streak = 1;
  for (let i = sortedAscDayKeysMs.length - 2; i >= 0; i -= 1) {
    const diffInDays =
      (sortedAscDayKeysMs[i + 1] - sortedAscDayKeysMs[i]) / MS_PER_DAY;
    if (diffInDays === 1) streak += 1;
    else if (diffInDays > 1) break;
  }
  return streak;
};

module.exports = {
  getDateKey,
  readingProgressPercentRounded,
  currentStreakFromSortedDayKeys,
  MS_PER_DAY,
};
