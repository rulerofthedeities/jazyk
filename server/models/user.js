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
  nrOfWords: Number,
  countdown: Boolean,
  mute: Boolean,
  color: Boolean,
  delay: Number,
  keyboard: Boolean
}, {_id : false});

var jazykSchema = new Schema({
  courses: [String],
  learn: {type: jazykLearnSchema, required: true}
}, {_id : false});

var userSchema = new Schema({
  userName: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  lan: {type: String, required: true},
  jazyk: jazykSchema,
  vocabulator: appSchema,
  grammator: appSchema
});

userSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('User', userSchema);
