const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        author: {
            type: String,
            required: [true, "Author is required"],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },

        ageGroup: {
            type: String,
            required: [true, "Age group is required"],
            enum: ['toddler', 'early-reader', 'middle-grade', 'young-adult'],
        },

        genres: {
            type: [String],
            required: [true, "At least one genre is required"],
        },

        readingLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
        },

        coverImage: {
            type: String,
            default: '',
        },

        // Optional: total number of pages, used by reading sessions
        pageCount: {
            type: Number,
            min: 1,
        },

        //Google Books intergration fields
        source: {
            type: String,
            enum: ['internal', 'google'],
            default: 'internal',
        },
        googleBookId: {
            type: String,
            default: '',
        },
        previewLink: {
            type: String,
            default: '',
        },

        pdfUrl: {
            type: String,
            default: '',
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

//Prevent duplicate imports from Google
storySchema.index(
  { googleBookId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleBookId: { $type: "string", $ne: "" }
    }
  }
);
//Search Support
storySchema.index({ title: 'text', author: 'text', description: 'text' });

module.exports = mongoose.model('Story', storySchema);