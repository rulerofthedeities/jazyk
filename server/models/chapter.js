var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var chapterSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, required: true},
  courseId: Schema.Types.ObjectId,
  name: String,
  nr: Number
});

module.exports = mongoose.model('Chapter', chapterSchema);
