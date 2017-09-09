const response = require('../response'),
      mongoose = require('mongoose'),
      Lesson = require('../models/lesson'),
      Course = require('../models/course');

module.exports = {
  getLessons: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    Lesson.find({courseId, isDeleted: false}, {}, {sort: {nr: 1}}, function(err, lessons) {
      response.handleError(err, res, 500, 'Error fetching lessons', function(){
        response.handleSuccess(res, lessons, 200, 'Fetched lessons');
      });
    });
  },
  getLessonHeaders: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId);
    Lesson.find({courseId, isDeleted: false}, {name: 1, chapterName: 1}, function(err, lessons) {
      response.handleError(err, res, 500, 'Error fetching lesson headers', function(){
        response.handleSuccess(res, lessons, 200, 'Fetched lesson headers');
      });
    });
  },
  /*
  getFirstLesson: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    Lesson.find({courseId}, {}, {sort: {chapterNr: 1, nr: 1}}, function(err, lessons) {
      response.handleError(err, res, 500, 'Error fetching lesson', function(){
        response.handleSuccess(res, lessons[0], 200, 'Fetched lesson');
      });
    });
  },
  */
  getLesson: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId);
    
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

    Lesson.findOneAndUpdate(
      {_id: lessonId},
      {$set: {
        name: lesson.name,
        exerciseTpes: lesson.exerciseTpes,
        chapterName : lesson.chapterName
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating lesson header', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson header');
      });
    });
  },
  updateIntro: function(req, res) {
    const intro = req.body.intro,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId);

    console.log('intro', userId, lessonId);
    
    Lesson.findOneAndUpdate(
      {_id: lessonId}, // userId
      {$set: {
        intro: intro
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating lesson intro', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson intro');
      });
    });
  },
  getIntro: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId);
    
    Lesson.findOne({_id: lessonId}, {_id: 0, intro: 1}, function(err, intro) {
      console.log('intro', intro);
      response.handleError(err, res, 500, 'Error fetching intro', function(){
        response.handleSuccess(res, intro, 200, 'Fetched intro from lesson');
      });
    });
  },
}
