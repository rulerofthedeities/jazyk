var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var languageSchema = new Schema({
  _id: {type: String, required: true},
  name: String,
  active: Boolean
})

var courseSchema = new Schema({
    _id: {type: Schema.Types.ObjectId, required: true},
    languageId: {type: String, required: true},
    name: String,
    attendance: Number,
    difficulty: Number,
    isPublished: Boolean,
    isPublic: Boolean
  }, {collection: 'courses'}
);

module.exports = mongoose.model('Course', courseSchema);
