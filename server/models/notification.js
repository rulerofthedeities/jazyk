var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var notificationSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, required: true},
  title: {type: String, required: true},
  message: {type: String, required: true},
  read: {type: Boolean, default: false},
  dt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Notification', notificationSchema);
