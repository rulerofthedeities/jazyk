var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var lanPairSchema = new Schema({
  from: String,
  to: String
}, {_id: false});

var wordSchema = new Schema({
  word: {type: String, required: true, trim: true},
  annotations: String,
  hint: {type: String, trim: true},
  info: {type: String, trim: true},
  alt: String
}, {_id: false});

var exerciseSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, required: true },
  local: {type: wordSchema, required: true, trim: true},
  foreign: {type: wordSchema, required: true, trim: true},
  wordDetailId: String,
  wordTpe: String,
  followingCase: String,
  genus: String,
  article: String,
  aspect: String,
  motion: String,
  image: String,
  audio: String,
  options: String,
  tpe: Number,
  difficulty: {type: Number, default: 0}
})

var ExerciseStepSchema = new Schema({
  active: Boolean,
  bidirectional: Boolean,
  ordered: Boolean
}, {_id: false})

var ExerciseStepsSchema = new Schema({
  intro: ExerciseStepSchema,
  study: ExerciseStepSchema,
  practise: ExerciseStepSchema,
  exam: ExerciseStepSchema
}, {_id: false})

var LessonOptionsSchema = new Schema({
  caseSensitive: {type: Boolean, default: false}
}, {_id: false})

var lessonSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, required: true},
  courseId: Schema.Types.ObjectId,
  languagePair: {type: lanPairSchema, required: true},
  name: String,
  chapterName: String,
  exerciseSteps: ExerciseStepsSchema,
  exercises: [exerciseSchema],
  options: {type: LessonOptionsSchema, required: true},
  intro: String,
  difficulty: Number,
  isPublished: Boolean,
  isDeleted: {type: Boolean, default: false}
})

module.exports = mongoose.model('Lesson', lessonSchema);
