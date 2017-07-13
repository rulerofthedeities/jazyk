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
    console.log(req.params.id);
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
    console.log('course', course);
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
    
    console.log('updating course header', course);

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
  addChapter: function(req, res) {
    console.log('adding');
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

    console.log('removing chapter', chapter);

    Course.findOneAndUpdate(
      {_id: courseId},
      { $pull: { chapters: chapter }}, function(err, result) {
      response.handleError(err, res, 500, 'Error removing chapter "' + chapter+ '"', function(){
        response.handleSuccess(res, result, 200, 'Removed chapter "' + chapter+ '"');
      });
    });
  }

  /*,
  setPublic: function(req, res) {
    const courseId = req.params.id;
    const status = req.params.status;
    Course.findOneAndUpdate(
      {_id: courseId},
      {$set: {
        isPublic: status === '1' ? true : false
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating public flag in course', function(){
        response.handleSuccess(res, result, 200, 'Updated public flag in course');
      });
    });
  },
  setPublish: function(req, res) {
    const courseId = req.params.id;
    const status = req.params.status;
    Course.findOneAndUpdate(
      {_id: courseId},
      {$set: {
        isPublished: status === '1' ? true : false
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating publish flag in course', function(){
        response.handleSuccess(res, result, 200, 'Updated publish flag in course');
      });
    });
  }*/
}
