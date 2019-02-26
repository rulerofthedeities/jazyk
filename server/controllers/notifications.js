const response = require('../response'),
      mongoose = require('mongoose'),
      Notification = require('../models/notification');

module.exports = {
  saveNotification: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          notification = new Notification(req.body);
    notification.save(function(err, result) {
      response.handleError(err, res, 400, 'Error saving notification', function(){
        response.handleSuccess(res, result);
      });
    });
  },
  getNotifications: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId},
          projection = {title: 1, read: 1, dt: 1},
          sort = {dt: -1};
    Notification.find(query, projection, {sort}, function(err, notifications) {
      response.handleError(err, res, 400, 'Error fetching notifications', function(){
        response.handleSuccess(res, notifications);
      });
    });
  },
  getNotification: function(req, res) {
    if (mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      const notificationId = new mongoose.Types.ObjectId(req.params.notificationId),
            query = {_id: notificationId};
      Notification.findOne(query, function(err, notification) {
        response.handleError(err, res, 400, 'Error fetching notification', function(){
          response.handleSuccess(res, notification);
        });
      });
    } else {
      response.handleSuccess(res, null);
    }
  },
  removeNotification: function(req, res) {
    const notificationId = new mongoose.Types.ObjectId(req.params.notificationId),
          query = {_id: notificationId};
    Notification.findOneAndRemove(query, function(err, result) {
      response.handleError(err, res, 400, 'Error removing notification', function(){
        response.handleSuccess(res, result);
      });
    });
  },
  removeNotifications: function(req, res) {
    // Remove all read notifications for this user
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, read: true};
    Notification.deleteMany(query, function(err, result) {
      response.handleError(err, res, 400, 'Error removing notifications', function(){
        response.handleSuccess(res, true);
      });
    });
  },
  setNotificationRead: function(req, res) {
    const notificationId = new mongoose.Types.ObjectId(req.body.notificationId),
          query = {_id: notificationId},
          update = {read: true};
    Notification.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error setting notification as read', function(){
        response.handleSuccess(res, true);
      });
    });
  },
  setAllNotificationsRead: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, read: false},
          update = {read: true};
    Notification.updateMany(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error marking all notifications unread', function(){
        response.handleSuccess(res, true);
      });
    });
  },
  getNotificationsCount: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, read: false};
    Notification.countDocuments(query, function(err, count) {
      response.handleError(err, res, 400, 'Error fetching notifications count', function(){
        response.handleSuccess(res, count.toString());
      });
    });
  }
}
