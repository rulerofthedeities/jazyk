const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course'),
      Lesson = require('../models/lesson');

updateCourseWordCount = function(courseId, total) {
  console.log('total', courseId, total);
  Course.findOneAndUpdate(
    {_id: courseId},
    {$set: {
      exerciseCount: total
    }}, function(err, result) {
      if (err) {
        console.log('ERREXE02: Error updating total # of exercises for course "' + courseId + '"')
      }
    });
}

getCourseWordCount = function(id) {
  const courseId = new mongoose.Types.ObjectId(id);
  //get # of words for all lessons in course
  const pipeline = [
    {$match: {courseId}},
    {$project: {count: {$size: "$exercises"}}},
    {$group: {_id: null, 'total': {$sum: "$count"}}}
  ];

  Lesson.aggregate(pipeline, function(err, count) {
    if (!err) {
      if (count[0]) {
        let total = count[0].total;
        updateCourseWordCount(courseId, total);
      }
    } else {
      console.log('ERREXE01: Error getting total number of exercise for course "' + courseId + '"')
    }
  });
}
module.exports = {
  getExercises: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.id);
    /*
    Exercise.find({lessonId}, {}, {sort:{nr:1}}, function(err, exercises) {
      response.handleError(err, res, 500, 'Error fetching exercises', function(){
        response.handleSuccess(res, exercises, 200, 'Fetched exercises');
      });
    });
    */
  },
  getExercise: function(req, res) {
    const exerciseId = new mongoose.Types.ObjectId(req.params.id);
    /*
    Exercise.findOne({_id: exerciseId}, {}, function(err, exercise) {
      response.handleError(err, res, 500, 'Error fetching exercise', function(){
        response.handleSuccess(res, exercise, 200, 'Fetched exercise');
      });
    });
    */
  },
  addExercise: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.id);
    const exercise = req.body;
    exercise._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID
    Lesson.findOneAndUpdate(
      {_id: lessonId},
      {$addToSet: {
        exercises: exercise
      }},
    function(err, result) {
      response.handleError(err, res, 500, 'Error adding exercise', function(){
        getCourseWordCount(result.courseId);
        response.handleSuccess(res, exercise, 200, 'Added exercise');
      });
    });
  },
  updateExercise: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.id);
    const exercise = new Exercise(req.body);
    /*
    Course.findOneAndUpdate(
      {_id: exerciseId},
      {$set: {
        name: exercise.name
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating exercise', function(){
        response.handleSuccess(res, result, 200, 'Updated exercise');
      });
    });
    */
  }
}
