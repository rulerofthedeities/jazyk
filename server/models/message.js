var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
  id: {type: Schema.Types.ObjectId, required: true},
  userName: {type: String, required: true},
  emailHash: String,
  trash: {type: Boolean, default: false},
  deleted: {type: Boolean, default: false},
  read: {type: Boolean, default: false}
}, {_id : false});

var messageSchema = new Schema({
  sender: {type: userSchema, required: true},
  recipient: {type: userSchema, required: true},
  message: {type: String, required: true},
  parentId: String,
  dt: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('Message', messageSchema);
