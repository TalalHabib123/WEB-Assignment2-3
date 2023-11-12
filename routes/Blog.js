const express = require('express');
const router = express.Router();
const User = require('../modals/User');
const BlogPost = require('../modals/Blog');
const Notification = require('../modals/Notification');


//Creating a blog post
router.post('/create', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const author = req.user.userId;
    const newBlogPost = new BlogPost({
      title,
      content,
      category,
      author,
      feedback: [],
    });
    await newBlogPost.save();
    res.status(201).json({ message: 'Blog post created successfully', blogPost: newBlogPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Getting all blog posts of a particular author
router.get('/all-of-author', async (req, res) => {
    try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const blogPosts = await BlogPost.find({})
      .populate('author', 'username')
      .sort({ created_at: -1})
      .skip(skip)
      .limit(pageSize);

    if (!blogPosts) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.status(200).json(blogPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Getting a particular blog post
router.get('/:postId', async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.postId).populate('author', 'username');
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.status(200).json(blogPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Updating a blog post
router.put('/:postId', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user.userId;
    const postId = req.params.postId;
    const blogPost = await BlogPost.findById(postId);
    if (!blogPost) {
        return res.status(404).json({ error: 'Blog post not found' });
    }

    if (blogPost.author.toString() !== userId) {
        return res.status(403).json({ error: 'You do not have permission to update this blog post' });
    }
    blogPost.title = title;
    blogPost.content = content;
    blogPost.category = category;
    await blogPost.save();
    res.status(200).json({ message: 'Blog post updated successfully', blogPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Deleting a blog post
router.delete('/:postId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.postId;
    const blogPost = await BlogPost.findById(postId);
    if (!blogPost) {
        return res.status(404).json({ error: 'Blog post not found' });
    }
    if (blogPost.author.toString() !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this blog post' });
    }
    await BlogPost.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Getting all blog posts with pagination and filtering as well as sorting and searching
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const filter = {
      $or: [],
      isDisabled: false,
    };
    //Author Filtering
    if (req.query.author) {
      const users = await User.find({ username: { $regex: new RegExp(req.query.title, 'i') } });
      if (users.length > 0) {
        const matchingUserIds = users.map(user => user._id);
        filter.$or.push({ author: { $in: matchingUserIds } });
      }
    }
    //Title Filtering
    if (req.query.title) {
      filter.$or.push({ title: { $regex: new RegExp(req.query.title, 'i') } });
    }
    //Category Filtering
    if(req.query.category) {
      filter.$or.push({ category: { $regex: new RegExp(req.query.category, 'i') } });
    }
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const skip = (page - 1) * pageSize;
    if (filter.$or.length === 0) {
      delete filter.$or;
    }
    //Searching and Sorting Blog Posts with Pagination and Filtering and Populating Author through foreign key
    const blogPosts = await BlogPost.find(filter)
      .populate('author', 'username')
      .sort({[sortBy]: sortOrder})
      .skip(skip)
      .limit(pageSize);
    if (!blogPosts) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.status(200).json(blogPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Rating a blog post
router.put('/:postId/rate-comment', async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.postId;
    const { rating, comment } = req.body;
    const blogPost = await BlogPost.findById(postId);

    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    const existingFeedback = blogPost.feedback.find((feedback) => feedback.user.toString() === userId);
    if (existingFeedback) {
      return res.status(400).json({ error: 'You have already rated and commented on this blog post' });
    }
    blogPost.feedback.push({
      user: userId,
      rating,
      comment,
    });
    await blogPost.save();
    const newNotification = new Notification({
      user: blogPost.author,
      type: 'comment',
      postId: blogPost._id,
    });
    await newNotification.save();
    res.status(201).json({ message: 'Rated and commented on the blog post successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;