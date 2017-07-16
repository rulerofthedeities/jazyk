const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course');


module.exports = {
  getAllCourses: function(req, res) {
    const languageId = req.params.lan;
    Course.find({'languagePair.to': languageId}, {}, function(err, courses) {
      response.handleError(err, res, 500, 'Error fetching courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched courses');
      });
    });
  },
  getCourse: function(req, res) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const courseId = new mongoose.Types.ObjectId(req.params.id);
      
      Course.findOne({_id: courseId}, {}, function(err, course) {
        response.handleError(err, res, 500, 'Error fetching course', function(){
          response.handleSuccess(res, course, 200, 'Fetched course');
        });
      });
    } else {
      //invalid id
      response.handleSuccess(res, null, 200, 'Invalid course id');
    }
  },
  addCourse: function(req, res) {
    const course = new Course(req.body);
    course._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID

    course.save(function(err, result) {
      response.handleError(err, res, 500, 'Error adding course', function(){
        response.handleSuccess(res, result, 200, 'Added course');
      });
    });
  },
  updateCourseHeader: function(req, res) {
    const course = new Course(req.body);
    const courseId = new mongoose.Types.ObjectId(course._id);

    Course.findOneAndUpdate(
      {_id: courseId},
      {$set: {
        name: course.name,
        isPublic: course.isPublic,
        isPublished: course.isPublished
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating course', function(){
        response.handleSuccess(res, result, 200, 'Updated course');
      });
    });
  },
  updateCourseProperty: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const property = req.body;
    const key = Object.keys(property)[0];
    if (key === 'isPublic' || key === 'isPublished') {
      Course.findOneAndUpdate(
        {_id: courseId}, property, function(err, result) {
        response.handleError(err, res, 500, 'Error updating ' + key, function(){
          response.handleSuccess(res, result, 200, 'Updated ' + key);
        });
      });
    }
  },
  addChapter: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const chapter = req.body;

    Course.findOneAndUpdate(
      {_id: courseId},
      {$addToSet: {
        chapters: chapter.name
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error adding chapter', function(){
        response.handleSuccess(res, result, 200, 'Added chapter');
      });
    });
  },
  getChapters: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);

    Course.find({_id: courseId}, {_id: 0, chapters: 1}, function(err, result) {
      response.handleError(err, res, 500, 'Error fetching chapters', function(){
        response.handleSuccess(res, result, 200, 'Fetched chapters');
      });
    });
  },
  removeChapter: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const chapter = req.body.name;

    Course.findOneAndUpdate(
      {_id: courseId},
      { $pull: { chapters: chapter }}, function(err, result) {
      response.handleError(err, res, 500, 'Error removing chapter "' + chapter+ '"', function(){
        response.handleSuccess(res, result, 200, 'Removed chapter "' + chapter+ '"');
      });
    });
  },
  updateChapters: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const chapters = req.body;

    Course.findOneAndUpdate(
      {_id: courseId},
      {$set: {
        chapters: chapters
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating chapters', function(){
        response.handleSuccess(res, result, 200, 'Updated chapters');
      });
    });
  },
  updateLessonIds: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const lessonIds = req.body;
    console.log('updating course', courseId, lessonIds);

    Course.findOneAndUpdate(
      {_id: courseId},
      {$set: {
        lessons: lessonIds
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating lesson Ids', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson Ids');
      });
    });
  }
}
