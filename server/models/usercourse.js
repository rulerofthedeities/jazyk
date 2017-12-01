var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var dateSchema = new Schema({
  dtSubscribed: {type: Date, default: Date.now},
  dtLastReSubscribed: Date,
  dtLastUnSubscribed: Date
}, {_id : false});

var userCourseSchema = new Schema({
  courseId: {type: Schema.Types.ObjectId, required: true},
  userId: {type: Schema.Types.ObjectId, required: true},
  subscribed: {type: Boolean, default: true},
  dt: {type: dateSchema, required: true}
});

userCourseSchema.index({userId: 1, courseId: 1}); 

module.exports = {
  model: mongoose.model('UserCourse', userCourseSchema),
  schema: userCourseSchema // for multiple dbs
};