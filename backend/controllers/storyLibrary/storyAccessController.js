const Story = require('../../models/storyLibrary/Story');
const Child = require('../../models/Child');

// Helper: map ageGroup to age range
const getAgeRangeForGroup = (ageGroup) => {
  switch (ageGroup) {
    case 'toddler': return { min: 3, max: 5 };
    case 'early-reader': return { min: 6, max: 8 };
    case 'middle-grade': return { min: 9, max: 12 };
    case 'young-adult': return { min: 13, max: 17 };
    default: return null;
  }
};

// @desc    Check if child can access a story
// @route   GET /api/stories/:storyId/access/:childId
// @access  Private
exports.checkStoryAccess = async (req, res) => {
  try {
    const { storyId, childId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }

    const range = getAgeRangeForGroup(story.ageGroup);
    if (!range) {
      return res.status(400).json({ success: false, message: 'Invalid story ageGroup' });
    }

    const allowed = child.age >= range.min && child.age <= range.max;

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Access denied: story is for ages ${range.min}-${range.max}, child age is ${child.age}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Access granted',
      data: {
        storyId: story._id,
        childId: child._id,
        storyAgeGroup: story.ageGroup,
        childAge: child.age
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};