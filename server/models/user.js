var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator');

var profileSchema = new Schema({

}, {_id : false});

var appSchema = new Schema({
  learnLan: {type: String, required: true},
  courses: [String]
}, {_id : false});

var userSchema = new Schema({
  userName: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  lan: {type: String, required: true},
  jazyk: appSchema,
  vocabulator: appSchema,
  grammator: appSchema
});

userSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('User', userSchema);
