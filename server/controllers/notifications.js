'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      Notification = require('../models/notification');

module.exports = {
  saveNotification: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          notification = new Notification(req.body);
    notification.save((err, result) => {
      response.handleError(err, res, 400, 'Error saving notification', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getNotifications: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId},
          projection = {title: 1, read: 1, dt: 1},
          sort = {dt: -1};
    Notification.find(query, projection, {sort}, (err, notifications) => {
      response.handleError(err, res, 400, 'Error fetching notifications', () => {
        response.handleSuccess(res, notifications);
      });
    });
  },
  getNotification: (req, res) => {
    if (mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      const notificationId = new mongoose.Types.ObjectId(req.params.notificationId),
            query = {_id: notificationId};
      Notification.findOne(query, (err, notification) => {
        response.handleError(err, res, 400, 'Error fetching notification', () => {
          response.handleSuccess(res, notification);
        });
      });
    } else {
      response.handleSuccess(res, null);
    }
  },
  removeNotification: (req, res) => {
    const notificationId = new mongoose.Types.ObjectId(req.params.notificationId),
          query = {_id: notificationId};
    Notification.findOneAndRemove(query, (err, result) => {
      response.handleError(err, res, 400, 'Error removing notification', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  removeNotifications: (req, res) => {
    // Remove all read notifications for this user
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, read: true};
    Notification.deleteMany(query, (err, result) => {
      response.handleError(err, res, 400, 'Error removing notifications', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  setNotificationRead: (req, res) => {
    const notificationId = new mongoose.Types.ObjectId(req.body.notificationId),
          query = {_id: notificationId},
          update = {read: true};
    Notification.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error setting notification as read', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  setAllNotificationsRead: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, read: false},
          update = {read: true};
    Notification.updateMany(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error marking all notifications unread', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  getNotificationsCount: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, read: false};
    Notification.countDocuments(query, (err, count) => {
      response.handleError(err, res, 400, 'Error fetching notifications count', () => {
        response.handleSuccess(res, count.toString());
      });
    });
  }
}
