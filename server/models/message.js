var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var messageSchema = new Schema({
  senderId: {type: Schema.Types.ObjectId, required: true},
  recipientId: {type: Schema.Types.ObjectId, required: true},
  message: {type: String, required: true},
  read: {type: Boolean, default: false},
  dt: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('Message', messageSchema);
