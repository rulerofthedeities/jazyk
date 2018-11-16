var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator');

var mainSchema = new Schema({
  lan: {type: String, required: true},
  myLan: String,
  background: {type: Boolean, default: true},
  gender: String
}, {_id : false});

var jazykReadSchema = new Schema({
  lan: {type: String, required: true},
  countdown: Boolean,
  delay: Number
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
  read: {type: jazykReadSchema, required: true},
  profile: {type: JazykProfileSchema, required: true},
  dt: dtSchema
}, {_id : false});

var mailVerificationSchema = new Schema({
  verificationId: {type: Schema.Types.ObjectId, required: true},
  dtLastSent: {type: Date, default: Date.now},
  timesSent: {type: Number, default: 0},
  isVerified: {type: Boolean, default: false}
}, {_id : false});

var mailOptInSchema = new Schema({
  info: {type: Boolean, default: false}
}, {_id : false});

var userSchema = new Schema({
  userName: {type: String, required: true, unique: true, trim: true},
  password: {type: String, required: true},
  email: {type: String, required: true, unique: true, trim: true},
  main: {type: mainSchema, required: true},
  emailHash: {type: String},
  mailVerification: {type: mailVerificationSchema},
  mailOptIn: {type: mailOptInSchema},
  jazyk: jazykSchema,
  isAdmin: {type: Boolean, default: false},
  dtCreated: {type: Date, default: Date.now}
});

userSchema.plugin(mongooseUniqueValidator);

module.exports = {
  model: mongoose.model('User', userSchema),
  schema: userSchema // for multiple dbs
};
