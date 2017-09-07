var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var resultSchema = new Schema({
  courseId: {type: Schema.Types.ObjectId, required: true},
  lessonId: {type: Schema.Types.ObjectId},
  userId: {type: Schema.Types.ObjectId, required: true},
  exerciseId: {type: Schema.Types.ObjectId, required: true},
  step: {type: String, required: true},
  points: Number,
  learnLevel: Number,
  isLearned: Boolean,
  dt: {type: Date, default: Date.now()},
  dtToReview: Date,
  daysBetweenReviews: Number,
  percentOverdue: Number,
  streak: String,
  sequence: Number, // To find the last saved doc for docs with same save time
  isLast: Boolean, // True if it is the last doc of a learn session
  isDifficult: Boolean // These are selected for the difficult step
});

resultSchema.index({userId: 1, courseId: 1, lessonId: 1, exerciseId: 1}); 

module.exports = mongoose.model('UserResult', resultSchema);
