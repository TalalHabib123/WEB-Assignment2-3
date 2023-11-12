const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  //Foriegn key
  type: { type: String, enum: ['follow', 'comment'], required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' },  //Foriegn key of BlogPost
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  //Foriegn key of User that started following
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
