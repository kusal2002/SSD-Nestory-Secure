const mongoose = require('mongoose');

const searchRequestSchema = new mongoose.Schema(
  {
    requesterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterName: {
      type: String,
      required: true,
      trim: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    suggestedBookName: {
      type: String,
      default: '',
      trim: true,
    },
    googleBookId: {
      type: String,
      default: '',
      trim: true,
    },
    author: {
      type: String,
      default: '',
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    previewLink: {
      type: String,
      default: '',
      trim: true,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'ignored'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

searchRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SearchRequest', searchRequestSchema);