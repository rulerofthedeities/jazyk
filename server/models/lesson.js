var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var lessonSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, required: true},
  courseId: Schema.Types.ObjectId,
  languageId: String,
  name: String,
  chapter: String,
  nr: Number,
  difficulty: Number,
  isPublished: Boolean
})

module.exports = mongoose.model('Lesson', lessonSchema);
