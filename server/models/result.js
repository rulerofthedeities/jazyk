var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var resultSchema = new Schema({
  courseId: Schema.Types.ObjectId,
  userId: Schema.Types.ObjectId,
  exerciseId: Schema.Types.ObjectId,
  study: Boolean,
  dtCreated: Date
});

resultSchema.index({userId: 1, courseId: 1, exerciseId: 1}); 

module.exports = mongoose.model('Result', resultSchema);
