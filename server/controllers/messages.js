const response = require('../response'),
      mongoose = require('mongoose'),
      Message = require('../models/message');

module.exports = {
  saveMessage: function(req, res) {
    const userId = req.decoded.user._id,
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
          userId = req.decoded.user._id,
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
  setMessageDelete: function(req, res) {
    const messageId = new mongoose.Types.ObjectId(req.body.messageId),
          tpe = req.body.tpe, // recipient or sender
          action = req.body.action, // deleted or trash
          query = {_id: messageId},
          update = {[tpe + '.' + action]: true};
    console.log(req.body);
    console.log('setting message to ' + action, messageId, update);
    Message.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 500, 'Error setting message to ' + action, function(){
        response.handleSuccess(res, result, 200, 'Set message to ' + action);
      });
    });
  }
}
