const express = require('express');
const router = express.Router();
const User = require('../modals/User');
const BlogPost = require('../modals/Blog');
const UserInteraction = require('../modals/Follower');
const Notification = require('../modals/Notification');


//Getting a User Profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Updating a User Profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, email } = req.body;
    await User.findByIdAndUpdate(userId, { username, email });
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Following a User
router.post('/follow/:userId', async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    const existingFollow = await UserInteraction.findOne({ follower: followerId, following: followingId });
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    const adminUser = await User.findById(followingId);
    if (adminUser.role === 'admin') {
      return res.status(400).json({ error: 'Cannot follow admin' });
    }
    const newFollow = new UserInteraction({
      follower: followerId,
      following: followingId,
    });
    await newFollow.save();
    const newNotification = new Notification({
      user: followingId,
      type: 'follow',
      followerId: followerId,
    });
    await newNotification.save();
    res.status(201).json({ message: 'Followed user successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Getting a User's Notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.userId, isRead: false })
      .sort({ createdAt: -1 })
      .populate('postId', 'title')
      .lean(); 
    if (notifications.length === 0) {
      return res.status(404).json({ error: 'No notifications found' });
    }
    notifications.forEach(notification => {
      if (notification.type === 'follow') {
        delete notification.postId;
      }
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Getting All Blog Posts of a User following authors
router.get('/feed', async (req, res) => {
  try {
    const userInteractions = await UserInteraction.find({ follower: req.user.userId }).select('following');
    const followingBloggers = userInteractions.map(interaction => interaction.following);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const feedBlogPosts = await BlogPost.find({ author: { $in: followingBloggers }, isDisabled: false })
    .populate('author', 'username') 
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(pageSize);
    if (feedBlogPosts.length === 0) {
      return res.status(404).json({ error: 'No blog posts found' });
    }
    res.status(200).json(feedBlogPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;