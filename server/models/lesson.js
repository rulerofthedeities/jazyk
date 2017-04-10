var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var chapterSchema = new Schema({
  nr: Number,
  name: String
}, { _id : false })

var lessonSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, required: true},
  courseId: Schema.Types.ObjectId,
  name: String,
  chapter: chapterSchema,
  nr: Number,
  difficulty: Number,
  isPublished: Boolean
})


module.exports = mongoose.model('Lesson', lessonSchema);
