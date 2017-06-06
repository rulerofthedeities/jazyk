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
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    
    Course.findOne({_id: courseId}, {}, function(err, course) {
      response.handleError(err, res, 500, 'Error fetching course', function(){
        response.handleSuccess(res, course, 200, 'Fetched course');
      });
    });
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
  updateCourse: function(req, res) {
    const course = new Course(req.body);
    const courseId = new mongoose.Types.ObjectId(course._id);
    
    Course.findOneAndUpdate(
      {_id: courseId},
      {$set: {
        name: course.name
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating course', function(){
        response.handleSuccess(res, result, 200, 'Updated course');
      });
    });
  },
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
  }
}
