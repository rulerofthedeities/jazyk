var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userCourseSchema = new Schema({
  courseId: {type: Schema.Types.ObjectId, required: true},
  userId: {type: Schema.Types.ObjectId, required: true},
  subscribed: {type: Boolean, default: true},
  currentLesson: String
});

userCourseSchema.index({userId: 1, courseId: 1}); 

module.exports = mongoose.model('UserCourse', userCourseSchema);
