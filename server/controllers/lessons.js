const response = require('../response'),
      mongoose = require('mongoose'),
      access = require('./access'),
      Lesson = require('../models/lesson'),
      Course = require('../models/course').model;

module.exports = {
  getLessons: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id),
          query = {
            courseId,
            isDeleted: false
          },
          options = {
            sort: {nr: 1}
          };
    Lesson.find(query, {}, options, function(err, lessons) {
      response.handleError(err, res, 400, 'Error fetching lessons', function(){
        response.handleSuccess(res, lessons, 200, 'Fetched lessons');
      });
    });
  },
  getLessonHeaders: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          query = {
            courseId,
            isDeleted: false
          },
          projection = {
            name: 1,
            chapterName: 1
          };
    Lesson.find(query, projection, function(err, lessons) {
      response.handleError(err, res, 400, 'Error fetching lesson headers', function(){
        response.handleSuccess(res, lessons, 200, 'Fetched lesson headers');
      });
    });
  },
  getLesson: function(req, res) {
    if (mongoose.Types.ObjectId.isValid(req.params.lessonId)) {
      const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
            query = {_id: lessonId};
      Lesson.findOne(query, {}, function(err, lesson) {
        response.handleError(err, res, 400, 'Error fetching lesson', function(){
          response.handleSuccess(res, lesson, 200, 'Fetched lesson');
        });
      });
    } else {
      //invalid id
      err = 'Invalid lesson id';
      response.handleError(err, res, 400, err);
    }
  },
  addLesson: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lesson = new Lesson(req.body),
          courseQuery = {
            _id: lesson.courseId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          };
    lesson._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID

    // First get access levels for course and add these to lesson
    Course.findOne(courseQuery, function(err, courseResult) {
      response.handleError(err, res, 400, 'Error getting course (adding lesson)', function(){
        if (courseResult) {
          lesson.access = courseResult.access;
          lesson.save(function(err, result) {
            response.handleError(err, res, 400, 'Error adding lesson', function(){
              response.handleSuccess(res, result, 200, 'Added lesson');
            });
          });
        } else {
          err = 'Not authorized';
          response.handleError(err, res, 401, 'Not authorized to add lesson');
        }
      });
    });
  },
  removeLesson: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {$set: {
            isDeleted: true
          }};
    Lesson.findOneAndUpdate(query, update, function(err, result) {
      if (result) {
        response.handleError(err, res, 400, 'Error removing lesson', function(){
          response.handleSuccess(res, result, 200, 'Removed lesson');
        });
      } else {
        err = 'Not authorized';
        response.handleError(err, res, 401, 'Not authorized to remove lesson');
      }
    });
  },
  updateLessonHeader: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lesson = new Lesson(req.body),
          lessonId = new mongoose.Types.ObjectId(lesson._id),
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {$set: {
            name: lesson.name,
            exerciseSteps: lesson.exerciseSteps,
            chapterName : lesson.chapterName,
            options: lesson.options
          }};
    Lesson.findOneAndUpdate(query, update, function(err, result) {
      if (result) {
        response.handleError(err, res, 400, 'Error updating lesson header', function(){
          response.handleSuccess(res, result, 200, 'Updated lesson header');
        });
      } else {
        err = 'Not authorized';
        response.handleError(err, res, 401, 'Not authorized to update lesson');
      }
    });
  },
  updateIntro: function(req, res) {
    const intro = req.body.intro,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {$set: {
            intro: intro
          }};
    Lesson.findOneAndUpdate(query, update, function(err, result) {
      if (result) {
        response.handleError(err, res, 400, 'Error updating lesson intro', function(){
          response.handleSuccess(res, result, 200, 'Updated lesson intro');
        });
      } else {
        err = 'Not authorized';
        response.handleError(err, res, 401, 'Not authorized to update lesson intro');
      }
    });
  },
  getIntro: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {_id: lessonId},
          projection = {_id: 0, intro: 1};
    Lesson.findOne(query, projection, function(err, intro) {
      response.handleError(err, res, 400, 'Error fetching intro', function(){
        response.handleSuccess(res, intro, 200, 'Fetched intro from lesson');
      });
    });
  }
}
