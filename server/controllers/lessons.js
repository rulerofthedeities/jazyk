const response = require('../response'),
      mongoose = require('mongoose'),
      Lesson = require('../models/lesson'),
      Chapter = require('../models/chapter');

module.exports = {
  getLessons: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    Lesson.find({courseId}, {}, {sort: {nr: 1}}, function(err, lessons) {
      response.handleError(err, res, 500, 'Error fetching lessons', function(){
        Chapter.find({courseId, isDeleted: false}, {} , {sort:{nr:1}}, function(err, chapters) {
          response.handleError(err, res, 500, 'Error fetching chapters', function(){
            response.handleSuccess(res, {lessons,chapters}, 200, 'Fetched chapters and lessons');
          });
        });
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
  updateLessonHeader: function(req, res) {
    const lesson = new Lesson(req.body);
    const lessonId = new mongoose.Types.ObjectId(lesson._id);

    Lesson.findOneAndUpdate(
      {_id: lessonId},
      {$set: {
        name: lesson.name,
        exerciseTpes: lesson.exerciseTpes,
        chapter : lesson.chapter, 
        chapterNr : lesson.chapterNr
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating lesson', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson');
      });
    });
  },
  addChapter: function(req, res) {
    let chapter = new Chapter(req.body);
    chapter._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID

    chapter.save(function(err, result) {
      response.handleError(err, res, 500, 'Error adding chapter', function(){
        response.handleSuccess(res, result, 200, 'Added chapter');
      });
    });
  },
  getChapters: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);

    Chapter.find({courseId, isDeleted: false}, {}, {sort: {nr: 1}}, function(err, result) {
      response.handleError(err, res, 500, 'Error adding chapter', function(){
        response.handleSuccess(res, result, 200, 'Added chapter');
      });
    });
  },
  removeChapter: function(req, res) {
    const chapterId = new mongoose.Types.ObjectId(req.params.id);

    console.log('removing chapter with id', chapterId);

    Chapter.findOneAndUpdate(
      {_id: chapterId},
      {$set: {isDeleted: true}}, function(err, result) {
      response.handleError(err, res, 500, 'Error removing chapter with id "' + chapterId+ '"', function(){
        response.handleSuccess(res, result, 200, 'Removed chapter with id "' + chapterId+ '"');
      });
    });
  }
}
