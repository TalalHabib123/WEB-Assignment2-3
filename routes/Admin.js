const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../modals/User');
const BlogPost = require('../modals/Blog');

//Getting all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({role:"user"}).select('-password');
    if (!users) {
      return res.status(404).json({ error: 'No users found' });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Blocking a user
router.put('/users/block/:userId', async (req, res) => {
  try {
    const userIdToBlock = req.params.userId;
    await User.findByIdAndUpdate(userIdToBlock, { isDisabled: true });
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Disabling a user
router.put('/blog-posts/disable/:postId', async (req, res) => {
  try {
    const postIdToDisable = req.params.postId;
    await BlogPost.findByIdAndUpdate(postIdToDisable, { isDisabled: true });
    res.status(200).json({ message: 'Blog post disabled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Getting all blog posts
router.get('/blog-posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    //A Query pipeline to get all blogs and their avg rating
    const aggregationPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      {
        $unwind: '$author',
      },
      {
        $project: {
          title: 1,
          author: '$author.username',
          created_at: 1,
          averageRating: { $avg: '$feedback.rating' },
          isDisabled: 1,
        },
      },
      {
        $sort: { created_at: -1 },
      },
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ];
    const blogPosts = await BlogPost.aggregate(aggregationPipeline);
    res.status(200).json(blogPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Getting a particular blog post
router.get('/blog-posts/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    //A Query pipeline to get a blog and its avg rating
    const aggregationPipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(postId), // Convert postId to ObjectId Otherwise it will not match
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      {
        $unwind: '$author',
      },
      {
        $project: {
          title: 1,
          author: '$author.username',
          created_at: 1,
          feedback: 1,
          isDisabled: 1,
          averageRating: { $avg: '$feedback.rating' },
        },
      },
    ];

    const blogPosts = await BlogPost.aggregate(aggregationPipeline);
    if (blogPosts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.status(200).json(blogPosts[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;