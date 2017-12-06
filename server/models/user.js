var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator');

var appSchema = new Schema({
  learnLan: {type: String, required: true},
}, {_id : false});

var mainSchema = new Schema({
  lan: {type: String, required: true},
  background: {type: Boolean, default: true}
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
  realName: {type: String, trim: true},
  timeZone: String,
  location: {type: String, trim: true},
  bio: {type: String, trim: true},
  nativeLan: {type: String, trim: true}
}, {_id : false});

var dtSchema = new Schema({
  joined: {type: Date, default: Date.now},
  lastLogin: {type: Date, default: Date.now}
}, {_id : false});

var jazykSchema = new Schema({
  learn: {type: jazykLearnSchema, required: true},
  profile: {type: JazykProfileSchema, required: true},
  dt: dtSchema
}, {_id : false});


var userSchema = new Schema({
  userName: {type: String, required: true, unique: true, trim: true},
  password: {type: String, required: true},
  email: {type: String, required: true, unique: true, trim: true},
  main: {type: mainSchema, required: true},
  emailHash: {type: String},
  jazyk: jazykSchema,
  vocabulator: appSchema,
  grammator: appSchema,
  dtCreated: {type: Date, default: Date.now}
});

userSchema.plugin(mongooseUniqueValidator);

module.exports = {
  model: mongoose.model('User', userSchema),
  schema: userSchema // for multiple dbs
};