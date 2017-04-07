const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course');


module.exports = {
  getCourses: function(req, res) {
    const language = req.params.lan;
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
        response.handleSuccess(res, result, 200, 'Updating course');
      });
    });
  }
}
