const response = require('../response'),
      mongoose = require('mongoose'),
      access = require('./access'),
      Course = require('../models/course').model,
      Lesson = require('../models/lesson'),
      Result = require('../models/result'),
      WordPair = require('../models/wordpair');

updateCourseWordCount = function(courseId, count) {
  const query = {_id: courseId},
        update = {$set: {
          totalCount: count.total,
          wordCount: count.words
        }};
  Course.findOneAndUpdate(query, update, function(err, result) {
    if (err) {
      console.log('ERREXE02: Error updating total # of exercises for course "' + courseId + '"')
    }
  });
}

getActiveLessonIds = function(lessons) {
  const lessonIds = [];
  lessons.forEach(chapter => {
    chapter.lessonIds.forEach(lessonId => {
      lessonIds.push(lessonId);
    })
  })
  return lessonIds;
}

getCourseWordCount = function(id) {
  // get # of words and avg score for all exercises in lessons
  const courseId = new mongoose.Types.ObjectId(id),
        courseQuery = {_id: courseId},
        courseProjection = {lessons: 1},
        lessonQuery = {courseId, isDeleted: false},
        lessonProjection = {exercises: 1};
  // First get all lessons for this course from Lesson collection with their exercise counts
  // Next get the course from the Course collection
  // Next get lesson Ids for this course from course.lessons
  // Next filter only lessons that are in this array

  const getCounts = async () => {
    const course = await Course.findOne(courseQuery, courseProjection),
          lessons = await Lesson.find(lessonQuery, lessonProjection);
    return {course, lessons};
  };

  getCounts().then((results) => {
    let wordCount = 0,
        totalCount = 0,
        wordExercises = [];
    const lessonIds = getActiveLessonIds(results.course.lessons);
    results.lessons.forEach(lesson => {
      if (lessonIds.find(id => id === lesson._id.toString())) {
        // lesson is active, add to count
        totalCount += lesson.exercises.length;
        wordExercises = lesson.exercises.filter(exercise => exercise.tpe === 0);
        wordCount += wordExercises.length;
      }
    });
    updateCourseWordCount(courseId, {total: totalCount, words: wordCount})

  }).catch((err) => {
    console.log(`ERREXE01: Error getting total number of exercises for course '${courseId}'`)
    console.log(err);
  });

  /*
  const pipeline = [
    {$match: {courseId, isDeleted: false}},
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
        updateCourseWordCount(courseId, count);
      }
    } else {
      console.log('ERREXE01: Error getting total number of exercise for course "' + courseId + '"')
    }
  });
  */
}

setResultExercisesAsDeleted = function(userId, lessonId, exerciseId) {
  // update the results for the exercise that has been deleted
  const query = {lessonId, exerciseId, userId},
        update = {isDeleted: true};
  Result.updateMany(query, update, function(err, result) {
    if (err) {
      console.log('ERREXE03: Error setting delete flag for exercise "' + exerciseId + '"')
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
  Lesson.aggregate(pipeline, function(err, choices) {
    console.log('get from all courses', choices);
    response.handleError(err, res, 400, 'Error fetching choices from multiple courses', function(){
      response.handleSuccess(res, choices);
    });
  });
}

module.exports = {
  /*
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
      response.handleError(err, res, 400, 'Error fetching exercises', function(){
        response.handleSuccess(res, exercises);
      });
    });
  },
  */
  addExercises: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exercises = req.body;
    exercises.forEach(exercise => {
      exercise._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID
    })
    const query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {
            $addToSet: {exercises: {$each: exercises}}
          };
    console.log(exercises);
    Lesson.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error adding exercise(s)', function() {
        if (result) {
          getCourseWordCount(result.courseId);
          response.handleSuccess(res, exercises);
        } else {
          err = 'Not authorized to add exercise';
          response.handleError(err, res, 401, err);
        }
      });
    });
  },
  updateExercise: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exercise = req.body,
          exerciseId = new mongoose.Types.ObjectId(exercise._id),
          query = {
            _id: lessonId,
            'exercises._id': exerciseId,
            access: access.checkAccess(userId, 2) // Must be at least author
          };
    if (exercise) {
      const update = { $set: { 'exercises.$': exercise}}
      Lesson.findOneAndUpdate(query, update, function(err, result) {
        response.handleError(err, res, 400, 'Error updating exercise', function(){
          if (result) {
            response.handleSuccess(res, null);
          } else {
            err = 'Not authorized to update exercise';
            response.handleError(err, res, 401, err);
          }
        });
      });
    } else {
      err = 'No exercise to update';
      response.handleError(err, res, 304, 'No exercise to update');
    }
  },
  updateExercises: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exercises = req.body
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {$set: { 'exercises': exercises}};

    Lesson.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating exercises in lesson ' + lessonId, function(){
        if (result) {
          response.handleSuccess(res, null);
        } else {
          err = 'Not authorized to update exercises';
          response.handleError(err, res, 401, err);
        }
      });
    });
  },
  removeExercise: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          exerciseId = new mongoose.Types.ObjectId(req.params.exerciseId),
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {
            $pull: { exercises: {_id : exerciseId }}
          };

    Lesson.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error removing exercise', function(){
        if (result) {
          getCourseWordCount(result.courseId);
          response.handleSuccess(res, null);
          setResultExercisesAsDeleted(userId, lessonId, exerciseId);
        } else {
          err = 'Not authorized to remove exercise';
          response.handleError(err, res, 401, err);
        }
      });
    });
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
      response.handleError(err, res, 400, 'Error fetching choices', function(){
        if (choices.length >= minChoices || !lans) {
          response.handleSuccess(res, choices);
        } else {
          const options = {maxWords, lans};
          getChoicesFromAllCourses(res, options);
        }
      });
    });
  }
}
