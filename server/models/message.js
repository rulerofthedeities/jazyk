var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
  id: {type: Schema.Types.ObjectId, required: true},
  userName: {type: String, required: true},
  emailHash: String
}, {_id : false});

var messageSchema = new Schema({
  sender: {type: userSchema, required: true},
  recipient: {type: userSchema, required: true},
  message: {type: String, required: true},
  read: {type: Boolean, default: false},
  trash: {type: Boolean, default: false},
  dt: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('Message', messageSchema);
