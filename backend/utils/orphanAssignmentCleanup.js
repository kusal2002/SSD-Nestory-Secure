const Child = require("../models/Child");
const Assignment = require("../models/Assignment");

/**
 * Deletes assignments for this parent where the child profile no longer exists
 * (e.g. child was removed before cascade delete existed). Safe to call on dashboard loads.
 */
async function deleteOrphanAssignmentsForParent(parentUserId) {
  const validChildIds = await Child.find({ parent: parentUserId }).distinct("_id");

  const filter =
    validChildIds.length === 0
      ? { assignedBy: parentUserId }
      : { assignedBy: parentUserId, child: { $nin: validChildIds } };

  const result = await Assignment.deleteMany(filter);
  return result.deletedCount || 0;
}

module.exports = { deleteOrphanAssignmentsForParent };
