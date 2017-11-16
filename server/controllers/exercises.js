const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course'),
      Lesson = require('../models/lesson');

updateCourseWordCount = function(courseId, totals) {
  allWordAndExercisesCount = 0;
  wordOnlyCount = 0;
  totals.forEach(count => {
    allWordAndExercisesCount += count.total;
    if (count._id === 0) {
      wordOnlyCount = count.total;
    }
  })
  console.log('count', courseId, 'total', allWordAndExercisesCount, 'words', wordOnlyCount);
  Course.findOneAndUpdate(
    {_id: courseId},
    {$set: {
      totalCount: allWordAndExercisesCount,
      wordCount: wordOnlyCount
    }}, function(err, result) {
      if (err) {
        console.log('ERREXE02: Error updating total # of exercises for course "' + courseId + '"')
      }
    }
  );
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
    {$group: {_id: '$exercises.tpe', 'total': {$sum: 1}}}
  ];

  Lesson.aggregate(pipeline, function(err, count) {
    if (!err) {
      if (count[0]) {
        console.log('TOTAL/SCORE', count);
        updateCourseWordCount(courseId, count);
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
  addExercises: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exercises = req.body;
    console.log('adding exercises', exercises);
    exercises.forEach(exercise => {
      exercise._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID
    })

    Lesson.findOneAndUpdate(
      {_id: lessonId},
      {$addToSet: {
        exercises: {$each: exercises}
      }},
    function(err, result) {
      response.handleError(err, res, 500, 'Error adding exercise(s)', function(){
        getCourseWordCount(result.courseId);
        response.handleSuccess(res, exercises, 200, 'Added exercise(s)');
      });
    });
  },
  updateExercise: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId);
    const exercise = req.body;
    const exerciseId = new mongoose.Types.ObjectId(exercise._id);

    console.log('updating exercise with _id ' + exerciseId + ' from lesson ' + lessonId);
    if (exercise) {
      Lesson.findOneAndUpdate(
        {_id: lessonId, 'exercises._id': exerciseId},
        { $set: { 'exercises.$': exercise}},
        function(err, result) {
          response.handleError(err, res, 500, 'Error updating exercise', function(){
            response.handleSuccess(res, null, 200, 'Updated exercise');
          });
        }
      );
    } else {
      response.handleSuccess(res, null, 304, 'No exercise to update');
    }
  },
  updateExercises: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId);
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
  /*
  getLessonChoices: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          projection = {_id:0, foreign: "$exercises.foreign.word", local: "$exercises.local.word"};
          
    const pipeline = [
      {$match: {_id: lessonId}},
      {$unwind: '$exercises'},
      {$project: projection}
    ];

    Lesson.aggregate(pipeline, function(err, docs) {
      console.log('Lesson choices:', docs);
      response.handleError(err, res, 500, 'Error fetching choices', function(){
        response.handleSuccess(res, docs, 200, 'Fetched choices');
      });
    });
  },*/
  getCourseChoices: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          max = 200,
          query = {courseId},
          projection = {_id:0, foreign: "$exercises.foreign.word", local: "$exercises.local.word"};

      console.log('Course choices:', query);
    const pipeline = [
      {$match: query},
      {$unwind: '$exercises'},
      {$match: {'exercises.tpe': 0}},
      {$sample: {size: max}},
      {$project: projection}
    ];
    Lesson.aggregate(pipeline, function(err, docs) {
      response.handleError(err, res, 500, 'Error fetching choices', function(){
        response.handleSuccess(res, docs, 200, 'Fetched choices');
      });
    });
  }
}
