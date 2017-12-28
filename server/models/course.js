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

var defaultsSchema = new Schema({
  caseSensitive: {type: Boolean, default: false},
  addArticle: {type: Boolean, default: false},
  region: String,
}, {_id: false});

var dtSchema = new Schema({
  created: {type: Date, default: Date.now},
  published: Date,
  completed: Date
}, {_id: false});

var courseSchema = new Schema({
    _id: {type: Schema.Types.ObjectId, required: true},
    creatorId: {type: Schema.Types.ObjectId, required: true},
    authorId: {type: [Schema.Types.ObjectId]},
    languagePair: {type: lanPairSchema, required: true},
    name: {type: String, trim: true},
    description: {type: String, trim: true},
    image: String,
    defaults: defaultsSchema,
    isPublished: {type: Boolean, default: false},
    isPublic: {type: Boolean, default: true},
    isInProgress: {type: Boolean, default: true},
    chapters: [String],
    lessons: [lessonSchema],
    totalCount: {type: Number, default: 0},
    wordCount: {type: Number, default: 0},
    dt: {type: dtSchema, required: true, default: {}}
  }, {collection: 'courses'}
);

module.exports = {
  model: mongoose.model('Course', courseSchema),
  schema: courseSchema // for multiple dbs
};
