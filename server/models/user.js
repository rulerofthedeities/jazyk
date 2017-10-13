var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator');

var profileSchema = new Schema({

}, {_id : false});

var appSchema = new Schema({
  learnLan: {type: String, required: true},
}, {_id : false});

var jazykLearnSchema = new Schema({
  lan: {type: String, required: true},
  nrOfWordsStudy: Number,
  nrOfWordsLearn: Number,
  nrOfWordsReview: Number,
  countdown: Boolean,
  mute: Boolean,
  color: Boolean,
  delay: Number,
  keyboard: Boolean
}, {_id : false});

var JazykProfileSchema = new Schema({
  realName: String,
  timeZone: String,
  location: String,
  bio: String,
  nativeLan: String,
}, {_id : false});

var jazykSchema = new Schema({
  learn: {type: jazykLearnSchema, required: true},
  profile: {type: JazykProfileSchema, required: true},
}, {_id : false});

var userSchema = new Schema({
  userName: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  lan: {type: String, required: true},
  jazyk: jazykSchema,
  vocabulator: appSchema,
  grammator: appSchema,
  dtJoined: {type: Date, default: Date.now()},
});

userSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('User', userSchema);
