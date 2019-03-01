'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      Message = require('../models/message');

module.exports = {
  saveMessage: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          recipient = req.body.recipient,
          sender = req.body.sender,
          msg = req.body.message,
          parentId = req.body.parentId,
          message = new Message({
            recipient: {
              id : new mongoose.Types.ObjectId(recipient.id),
              userName: recipient.userName,
              emailHash: recipient.emailHash
            },
            sender: {
              id : new mongoose.Types.ObjectId(sender.id),
              userName: sender.userName,
              emailHash: sender.emailHash
            },
            message: msg,
            parentId
          });
    message.save((err, result) => {
      response.handleError(err, res, 400, 'Error saving message', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getMessages: (req, res) => {
    const tpe = req.params.tpe,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          projection = {},
          options = {sort: {dt: -1}};
    let query = null;
    switch (tpe) {
      case 'inbox':
        query = {
          'recipient.id': userId,
          'recipient.trash': false,
          'recipient.deleted': false
        };
      break;
      case 'trash':
        query = {
          'recipient.id': userId,
          'recipient.trash': true,
          'recipient.deleted': false
        };
      break;
      case 'sent':
        query = {
          'sender.id': userId,
          'sender.trash': false,
          'sender.deleted': false
        };
      break;
    }
    if (query) {
      Message.find(query, projection, options, (err, messages) => {
        response.handleError(err, res, 400, 'Error fetching messages', () => {
          response.handleSuccess(res, messages);
        });
      });
    } else {
      response.handleSuccess(res, null);
    }
  },
  getMessage: (req, res) => {
    if (mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      const messageId = new mongoose.Types.ObjectId(req.params.messageId),
            userId = new mongoose.Types.ObjectId(req.decoded.user._id),
            query = {
              _id: messageId,
              $or: [{'sender.id': userId},
              {'recipient.id': userId}]
            };
      Message.findOne(query, (err, message) => {
          response.handleError(err, res, 400, 'Error fetching message', () => {
            response.handleSuccess(res, message);
          });
        });
    } else {
      response.handleSuccess(res, null);
    }
  },
  setMessageRead: (req, res) => {
    const messageId = new mongoose.Types.ObjectId(req.body.messageId),
          query = {_id: messageId},
          update = {'recipient.read': true};
    Message.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error setting message as read', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  setAllMessagesRead: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {'recipient.id': userId, 'recipient.read': false},
          update = {'recipient.read': true};
    Message.updateMany(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error marking all messages unread', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  setMessageDelete: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          messageId = new mongoose.Types.ObjectId(req.body.messageId),
          tpe = req.body.tpe, // recipient or sender
          action = req.body.action, // deleted or trash
          query = {_id: messageId, [tpe + '.id']: userId},
          update = {[tpe + '.' + action]: true};
    Message.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error setting message to ' + action, () => {
        response.handleSuccess(res, true);
      });
    });
  },
  setMessagesDelete: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            'recipient.id': userId,
            'recipient.read': true,
            'recipient.trash': false,
            'recipient.deleted': false
          },
          update = {'recipient.trash': true};
    Message.updateMany(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error setting messages to trash', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  setEmptyTrash: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            'recipient.id': userId,
            'recipient.trash': true,
            'recipient.deleted': false
          },
          update = {'recipient.deleted': true};
    Message.updateMany(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error setting messages to deleted', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  getMessagesCount: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            'recipient.id': userId,
            'recipient.read': false,
            'recipient.trash': false,
            'recipient.deleted': false
          };
    Message.countDocuments(query, (err, count) => {
      response.handleError(err, res, 400, 'Error fetching messages count', () => {
        response.handleSuccess(res, count.toString());
      });
    });
  }
}
