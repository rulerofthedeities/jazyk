const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course'),
      Lesson = require('../models/lesson'),
      WordPair = require('../models/wordpair');

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

getChoicesFromAllCourses = function(res, options) {
  // get choices from all courses of the specified language if there aren't enough words in the course
  const maxWords = options.maxWords,
        lanPair = options.lans.split('-'),
        query = {
          'languagePair.from': lanPair[0],
          'languagePair.to': lanPair[1]
        },
        projection = {
          _id:0,
          foreign: "$exercises.foreign.word",
          local: "$exercises.local.word",
          foreignArticle: "$exercises.foreign.article",
          localArticle: "$exercises.local.article"
        },
        pipeline = [
          {$match: query},
          {$unwind: '$exercises'},
          {$match: {'exercises.tpe': 0}},
          {$sample: {size: maxWords}},
          {$project: projection}
        ];
  console.log('allcourses', pipeline);
  Lesson.aggregate(pipeline, function(err, choices) {
    response.handleError(err, res, 500, 'Error fetching choices from multiple courses', function(){
      response.handleSuccess(res, choices, 200, 'Fetched choices from multiple courses');
    });
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
    const query = {'exercises._id': {$in: exerciseIds}},
          pipeline = [
            {$match: {courseId}},
            {$unwind: '$exercises'},
            {$match: query},
            {$project: {_id: 0, exercise: '$exercises'}}
          ];
    Lesson.aggregate(pipeline, function(err, exercises) {
      response.handleError(err, res, 500, 'Error fetching exercises', function(){
        response.handleSuccess(res, exercises, 200, 'Fetched exercises');
      });
    });
  },
  addExercises: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exercises = req.body;
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
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exercise = req.body,
          exerciseId = new mongoose.Types.ObjectId(exercise._id);

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
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exercises = req.body;

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
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exerciseId = new mongoose.Types.ObjectId(req.params.exerciseId);

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
  getCourseChoices: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          lans = req.params.lans,
          maxWords = 200,
          minChoices = 8;
          query = {courseId},
          projection = {
            _id:0,
            foreign: "$exercises.foreign.word",
            local: "$exercises.local.word",
            foreignArticle: "$exercises.foreign.article",
            localArticle: "$exercises.local.article"
          },
          pipeline = [
            {$match: query},
            {$unwind: '$exercises'},
            {$match: {'exercises.tpe': 0}},
            {$sample: {size: maxWords}},
            {$project: projection}
          ];
    Lesson.aggregate(pipeline, function(err, choices) {
      response.handleError(err, res, 500, 'Error fetching choices', function(){
        if (choices.length >= minChoices || !lans) {
          response.handleSuccess(res, choices, 200, 'Fetched choices');
        } else {
          console.log('fetching choices from all courses');
          const options = {maxWords, lans}
          getChoicesFromAllCourses(res, options);
        }
      });
    });
  }
}
