const response = require('../response'),
      mongoose = require('mongoose'),
      Lesson = require('../models/lesson');

module.exports = {
  getLessons: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    Lesson.find({courseId}, {}, function(err, lessons) {
      response.handleError(err, res, 500, 'Error fetching lessons', function(){
        response.handleSuccess(res, lessons, 200, 'Fetched lessons');
      });
    });
  },
  getLesson: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.id);
    
    Lesson.findOne({_id: lessonId}, {}, function(err, lesson) {
      response.handleError(err, res, 500, 'Error fetching lesson', function(){
        response.handleSuccess(res, lesson, 200, 'Fetched lesson');
      });
    });
  },
  addLesson: function(req, res) {
    const lesson = new Lesson(req.body);
    lesson._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID

    console.log('adding lesson', lesson);

    lesson.save(function(err, result) {
      response.handleError(err, res, 500, 'Error adding lesson', function(){
        response.handleSuccess(res, result, 200, 'Added lesson');
      });
    });
  },
  updateLesson: function(req, res) {
    const lesson = new Lesson(req.body);
    const lessonId = new mongoose.Types.ObjectId(lesson._id);
    
    console.log('updating lesson', lesson);

    Course.findOneAndUpdate(
      {_id: lessonId},
      {$set: {
        name: lesson.name
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating lesson', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson');
      });
    });
  }
}
