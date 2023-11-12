const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedback: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, default: 0 },
      comment: { type: String, default: '' },
      created_on: { type: Date, default: Date.now },
    },
  ],
  created_at: { type: Date, default: Date.now },
  isDisabled: { type: Boolean, default: false },
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost;