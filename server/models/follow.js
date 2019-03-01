'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var followSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, required: true},
  followId: {type: Schema.Types.ObjectId, required: true},
  follow: {type: Boolean, default: true}
});

followSchema.index({userId: 1, followId: 1}, {unique: true});

module.exports = mongoose.model('Follow', followSchema);
