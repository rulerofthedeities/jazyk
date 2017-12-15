const response = require('../response'),
      mongoose = require('mongoose'),
      Message = require('../models/message');

module.exports = {
  saveMessage: function(req, res) {
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
    message.save(function(err, result) {
      response.handleError(err, res, 500, 'Error saving message', function(){
        response.handleSuccess(res, result, 200, 'Saved message');
      });
    });
  },
  getMessages: function(req, res) {
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
      Message.find(query, projection, options, function(err, messages) {
        response.handleError(err, res, 500, 'Error fetching messages', function(){
          response.handleSuccess(res, messages, 200, 'Fetched messages');
        });
      });
    } else {
      response.handleSuccess(res, null, 200, 'Unknown message type');
    }
  },
  getMessage: function(req, res) {
    const messageId = new mongoose.Types.ObjectId(req.params.messageId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {_id: messageId, $or: [{'sender.id': userId}, {'recipient.id': userId}]};
    Message.findOne(query, function(err, message) {
        response.handleError(err, res, 500, 'Error fetching message', function(){
          response.handleSuccess(res, message, 200, 'Fetched message');
        });
      });
  },
  setMessageRead: function(req, res) {
    const messageId = new mongoose.Types.ObjectId(req.body.messageId),
          query = {_id: messageId},
          update = {'recipient.read': true};
    Message.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 500, 'Error setting message as read', function(){
        response.handleSuccess(res, true, 200, 'Read message');
      });
    });
  },
  setAllMessagesRead: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {'recipient.id': userId, 'recipient.read': false},
          update = {'recipient.read': true};
    Message.updateMany(query, update, function(err, result) {
      response.handleError(err, res, 500, 'Error marking all messages unread', function(){
        response.handleSuccess(res, result, 200, 'Marked all messages unread');
      });
    });
  },
  setMessageDelete: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          messageId = new mongoose.Types.ObjectId(req.body.messageId),
          tpe = req.body.tpe, // recipient or sender
          action = req.body.action, // deleted or trash
          query = {_id: messageId, [tpe + '.id']: userId},
          update = {[tpe + '.' + action]: true};
    Message.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 500, 'Error setting message to ' + action, function(){
        response.handleSuccess(res, result, 200, 'Set message to ' + action);
      });
    });
  },
  setMessagesDelete: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            'recipient.id': userId,
            'recipient.read': true,
            'recipient.trash': false,
            'recipient.deleted': false 
          },
          update = {'recipient.trash': true};
    Message.updateMany(query, update, function(err, result) {
      response.handleError(err, res, 500, 'Error setting messages to trash', function(){
        response.handleSuccess(res, result, 200, 'Set messages to trash');
      });
    });
  },
  setEmptyTrash: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            'recipient.id': userId,
            'recipient.trash': true,
            'recipient.deleted': false 
          },
          update = {'recipient.deleted': true};
    Message.updateMany(query, update, function(err, result) {
      response.handleError(err, res, 500, 'Error setting messages to deleted', function(){
        response.handleSuccess(res, result, 200, 'Set messages to deleted');
      });
    });
  },
  getMessagesCount: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            'recipient.id': userId,
            'recipient.read': false,
            'recipient.trash': false,
            'recipient.deleted': false
          };
    Message.count(query, function(err, count) {
      response.handleError(err, res, 500, 'Error fetching messages count', function(){
        response.handleSuccess(res, count, 200, 'Fetched messages count');
      });
    });
  }
}
