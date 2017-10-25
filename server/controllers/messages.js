const response = require('../response'),
      mongoose = require('mongoose'),
      Message = require('../models/message');
      
module.exports = {
  saveMessage: function(req, res) {
    const userId = req.decoded.user._id,
          recipient = req.body.recipient,
          sender = req.body.sender,
          msg = req.body.msg,
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
            message: msg
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
          trash: false
        };
      break;
      case 'trash':
        query = {
          'recipient.id': userId,
          trash: true
        };
      break;
      case 'sent':
        query = {
          'sender.id': userId,
          trash: false
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
          update = {read: true};
    console.log('setting message read', messageId);
    Message.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 500, 'Error setting message as read', function(){
        response.handleSuccess(res, true, 200, 'Read message');
      });
    });
  }
}
