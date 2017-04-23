const response = require('../response'),
      mongoose = require('mongoose'),
      Exercise = require('../models/exercise');

module.exports = {
  getExercises: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.id);
    Exercise.find({lessonId}, {}, {sort:{nr:1}}, function(err, exercises) {
      response.handleError(err, res, 500, 'Error fetching exercises', function(){
        response.handleSuccess(res, exercises, 200, 'Fetched exercises');
      });
    });
  },
  getExercise: function(req, res) {
    const exerciseId = new mongoose.Types.ObjectId(req.params.id);
    
    Exercise.findOne({_id: exerciseId}, {}, function(err, exercise) {
      response.handleError(err, res, 500, 'Error fetching exercise', function(){
        response.handleSuccess(res, exercise, 200, 'Fetched exercise');
      });
    });
  },
  addExercise: function(req, res) {
    const exercise = new Exercise(req.body);
    exercise._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID

    exercise.save(function(err, result) {
      response.handleError(err, res, 500, 'Error adding exercise', function(){
        response.handleSuccess(res, result, 200, 'Added exercise');
      });
    });
  },
  updateExercise: function(req, res) {
    const exercise = new Exercise(req.body);
    const exerciseId = new mongoose.Types.ObjectId(exercise._id);

    Course.findOneAndUpdate(
      {_id: exerciseId},
      {$set: {
        name: exercise.name
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating exercise', function(){
        response.handleSuccess(res, result, 200, 'Updated exercise');
      });
    });
  }
}
