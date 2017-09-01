const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course'),
      Lesson = require('../models/lesson');

updateCourseWordCount = function(courseId, total) {
  console.log('total', courseId, total);
  Course.findOneAndUpdate(
    {_id: courseId},
    {$set: {
      exerciseCount: total.total,
      difficulty: total.scores
    }}, function(err, result) {
      if (err) {
        console.log('ERREXE02: Error updating total # of exercises for course "' + courseId + '"')
      }
    });
}

getCourseWordCount = function(id) {
  const courseId = new mongoose.Types.ObjectId(id);
  //get # of words and avg score for all exercises in lessons
  const pipeline = [
    {$match: {courseId}},
    {$unwind: {
      path : "$exercises",
      includeArrayIndex : "arrayIndex",
      preserveNullAndEmptyArrays : false
    }},
    {$project: {'score': '$exercises.score'}},
    {$group: {_id: null, 'total': {$sum: 1}, 'scores': {$avg: "$score"}}}
  ];

  Lesson.aggregate(pipeline, function(err, count) {
    if (!err) {
      if (count[0]) {
        console.log('TOTAL/SCORE', count[0]);
        updateCourseWordCount(courseId, count[0]);
      }
    } else {
      console.log('ERREXE01: Error getting total number of exercise for course "' + courseId + '"')
    }
  });
}
module.exports = {
  getExercises: function(req, res) {
    const parms = req.query,
          exerciseIds = [],
          courseId = new mongoose.Types.ObjectId(req.params.courseId);
    let exerciseId;
    for (var key in parms) {
      if (parms[key]) {
        exerciseId = new mongoose.Types.ObjectId(parms[key]);
        exerciseIds.push(exerciseId);
      }
    }
    const query = {'exercises._id': {$in: exerciseIds}};

    const pipeline = [
      {$match: {courseId}},
      {$unwind: '$exercises'},
      {$match: query},
      {$project: {_id: 0, exercise: '$exercises'}}
    ];

    console.log('fetching exercises', pipeline);
    Lesson.aggregate(pipeline, function(err, exercises) {
      console.log('exercises', exercises);
      response.handleError(err, res, 500, 'Error fetching exercises', function(){
        response.handleSuccess(res, exercises, 200, 'Fetched exercises');
      });
    });
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
    const exercise = req.body;
    const exerciseId = new mongoose.Types.ObjectId(exercise._id);

    console.log('updating exercise with _id ' + exerciseId + ' from lesson ' + lessonId);

    Lesson.findOneAndUpdate(
      {_id: lessonId, 'exercises._id': exerciseId},
      { $set: { 'exercises.$': exercise}},
      function(err, result) {
        response.handleError(err, res, 500, 'Error updating exercise', function(){
          response.handleSuccess(res, null, 200, 'Updated exercise');
        });
      }
    );
  },
  updateExercises: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.id);
    const exercises = req.body;

    console.log('updating all exercises for lesson ' + lessonId);

    Lesson.findOneAndUpdate(
      {_id: lessonId},
      { $set: { 'exercises': exercises}},
      function(err, result) {
        response.handleError(err, res, 500, 'Error updating exercises in lesson ' + lessonId, function(){
          response.handleSuccess(res, null, 200, 'Updated exercises in lesson ' + lessonId);
        });
      }
    );
  },
  removeExercise: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId);
    const exerciseId = new mongoose.Types.ObjectId(req.params.exerciseId);

    console.log('removing exercise with _id ' + exerciseId + ' from lesson ' + lessonId);

    Lesson.findOneAndUpdate(
      {_id: lessonId},
      { $pull: { exercises: {_id : exerciseId }}},
      function(err, result) {
        response.handleError(err, res, 500, 'Error removing exercise', function(){
          getCourseWordCount(result.courseId);
          response.handleSuccess(res, null, 200, 'Removed exercise');
        });
      }
    );
  },
  getChoices: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.id);
    const isBidirectional = req.params.dir === '1' ? true : false;
    let projection = {_id:0, choices: {foreign: "$exercises.foreign.word"}};
    if (isBidirectional) {
      projection = {_id:0, choices: {foreign: "$exercises.foreign.word", local: "$exercises.local.word"}};
    }
    const pipeline = [
      {$match: {_id: lessonId}},
      {$project: projection}
    ];
    Lesson.aggregate(pipeline, function(err, docs) {
      response.handleError(err, res, 500, 'Error fetching choices', function(){
        response.handleSuccess(res, docs[0].choices, 200, 'Fetched choices');
      });
    });
  },
}
