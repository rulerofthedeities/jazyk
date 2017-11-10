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

var lessonSchema = new Schema({
  chapter: String,
  lessonIds: [String]
}, {_id: false});

var courseSchema = new Schema({
    _id: {type: Schema.Types.ObjectId, required: true},
    creatorId: {type: Schema.Types.ObjectId, required: true},
    authorId: {type: [Schema.Types.ObjectId]},
    languagePair: {type: lanPairSchema, required: true},
    name: String,
    image: String,
    attendance: Number,
    difficulty: Number,
    isPublished: Boolean,
    isPublic: Boolean,
    chapters: [String],
    lessons: [lessonSchema],
    totalCount: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    exercisesDone: { type: Number, default: 0 },
    dtAdded: { type: Date, default: Date.now }
  }, {collection: 'courses'}
);

module.exports = mongoose.model('Course', courseSchema);
