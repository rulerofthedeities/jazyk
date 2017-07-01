var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var lanPairSchema = new Schema({
  from: String,
  to: String
}, {_id: false});

var exerciseSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  nr: { type: Number, required: true },
  localWord: { type: String, required: true },
  foreignWord: { type: String, required: true },
  wordTpe: String,
  aspect: String,
  followingCase: String,
  genus: String,
  hint: String,
  info: String,
  localAlt: String,
  foreignAlt: String,
  image: String,
  audios: [String],
  score: { type: Number, default: 0 }
})

var ExerciseTpesSchema = new Schema({
  learn: Boolean,
  practise: Boolean,
  test: Boolean,
  exam: Boolean
}, {_id: false})

var lessonSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  courseId: Schema.Types.ObjectId,
  languagePair: {type: lanPairSchema, required: true},
  name: String,
  chapter: String,
  chapterNr: Number,
  nr: Number,
  exerciseTpes: ExerciseTpesSchema,
  exercises: [exerciseSchema],
  difficulty: Number,
  isPublished: Boolean,
  isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('Lesson', lessonSchema);
