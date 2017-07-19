const response = require('../response'),
      mongoose = require('mongoose'),
      Lesson = require('../models/lesson'),
      Course = require('../models/course');

module.exports = {
  getLessons: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    Lesson.find({courseId, isDeleted: false}, {}, {sort: {nr: 1}}, function(err, lessons) {
      response.handleError(err, res, 500, 'Error fetching lessons', function(){
        //Course.find({_id: courseId}, {_id: 0, chapters: 1}, function(err, chapters) {
          //response.handleError(err, res, 500, 'Error fetching chapters', function(){
            response.handleSuccess(res, lessons, 200, 'Fetched lessons');
          //});
        //});
      });
    });
  },
  getFirstLesson: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    Lesson.find({courseId}, {}, {sort: {chapterNr: 1, nr: 1}}, function(err, lessons) {
      response.handleError(err, res, 500, 'Error fetching lesson', function(){
        response.handleSuccess(res, lessons[0], 200, 'Fetched lesson');
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

    lesson.save(function(err, result) {
      response.handleError(err, res, 500, 'Error adding lesson', function(){
        response.handleSuccess(res, result, 200, 'Added lesson');
      });
    });
  },
  removeLesson: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.id);
    Lesson.findOneAndUpdate(
      {_id: lessonId},
      {$set: {
        isDeleted: true
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error removing lesson', function(){
        response.handleSuccess(res, result, 200, 'Removed lesson');
      });
    });
  },
  updateLessonHeader: function(req, res) {
    const lesson = new Lesson(req.body);
    const lessonId = new mongoose.Types.ObjectId(lesson._id);

    console.log(lesson.exerciseTpes);

    Lesson.findOneAndUpdate(
      {_id: lessonId},
      {$set: {
        name: lesson.name,
        exerciseTpes: lesson.exerciseTpes,
        chapterName : lesson.chapterName
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating lesson', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson');
      });
    });
  }
}
