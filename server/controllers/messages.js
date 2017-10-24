const response = require('../response'),
      mongoose = require('mongoose'),
      Message = require('../models/message');
      
module.exports = {
  saveMessage: function(req, res) {
    const userId = req.decoded.user._id,
          recipientId = new mongoose.Types.ObjectId(req.body.recipientId),
          msg = req.body.msg,
          message = new Message({
            recipientId,
            senderId: userId,
            message: msg
          });
    message.save(function(err, result) {
      response.handleError(err, res, 500, 'Error saving message', function(){
        response.handleSuccess(res, result, 200, 'Saved message');
      });
    });
    console.log('saving message', msg);
  }
}