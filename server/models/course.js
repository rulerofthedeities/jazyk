var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var languageSchema = new Schema({
  _id: {type: String, required: true},
  name: String,
  active: Boolean
});

var lanPairSchema = new Schema({
  from: String,
  to: String
}, {_id: false});

var courseSchema = new Schema({
    _id: {type: Schema.Types.ObjectId, required: true},
    languagePair: {type: lanPairSchema, required: true},
    name: String,
    attendance: Number,
    difficulty: Number,
    isPublished: Boolean,
    isPublic: Boolean
  }, {collection: 'courses'}
);

module.exports = mongoose.model('Course', courseSchema);
