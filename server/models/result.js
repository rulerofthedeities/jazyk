var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var resultSchema = new Schema({
  courseId: {type: Schema.Types.ObjectId, required: true},
  userId: {type: Schema.Types.ObjectId, required: true},
  exerciseId: {type: Schema.Types.ObjectId, required: true},
  step: {type: String, required: true},
  points: Number,
  learnLevel: Number,
  dt: {type: Date, required: true},
  sequence: Number // To find the last saved doc for docs with same save time
});

resultSchema.index({userId: 1, courseId: 1, exerciseId: 1}); 

module.exports = mongoose.model('Result', resultSchema);
