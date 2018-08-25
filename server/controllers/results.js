const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result'),
      Lesson = require('../models/lesson'),
      lessons = require('./lessons'),
      exercisesModule = require('./exercises'),
      ErrorModel = require('../models/error'),
      Session = require('../models/book').session,
      maxExercises = 120;

hasIntroStep = function(res, results, userId, courseId, lessonId, cb) {
  const query = {
    courseId,
    lessonId,
    userId,
    exerciseId: null,
    step: results.step
  };
  Result.find(query, function(err, result) {
    response.handleError(err, res, 400, `Error fetching ${results.step} step`, function() {
      const hasResult = result && result.length ? true: false;
      cb(hasResult);
    });
  })
}

saveIntroStep = function(res, results, userId, courseId, lessonId) {
  const introResult = new Result({
    courseId,
    lessonId,
    userId,
    exerciseId: null,
    step: results.step
  });
  introResult.save(function(err, result) {
    response.handleError(err, res, 400, 'Error saving result', function(){
      response.handleSuccess(res, result);
    });
  });
},
saveStudy = function(res, results, userId, courseId, lessonId) {
  let exerciseId, filterObj;
  if (results.data.length > 0) {
    const docs = results.data.map(doc =>
    {
      exerciseId = new mongoose.Types.ObjectId(doc.exerciseId);
      filterObj = {
        userId,
        courseId,
        lessonId,
        exerciseId,
        tpe: doc.tpe,
        step: 'study'
      };
      return {
        updateOne: {
          filter: filterObj,
          update: {
            $set: filterObj,
            $setOnInsert: {
              points: doc.points,
              isRepeat: doc.isRepeat,
              isLast: true,
              isDeleted: false,
              dt: new Date()
            }
          },
          upsert: true
        }
      }
    })
    Result.collection.bulkWrite(docs, function(err, bulkResult) {
      response.handleError(err, res, 400, 'Error saving user results for study', function(){
        response.handleSuccess(res, bulkResult);
      });
    })
  } else {
    response.handleSuccess(res, null);
  }
}

saveStep = function(res, results, userId, courseId, lessonId) {
  let exerciseId, result, dtToReview;
  const docs = results.data.map(doc =>
  {
    exerciseId = new mongoose.Types.ObjectId(doc.exerciseId);
    lessonId = doc.lessonId ? new mongoose.Types.ObjectId(doc.lessonId) : lessonId;
    result = {
      userId,
      courseId,
      lessonId,
      exerciseId,
      step: results.step,
      tpe: doc.tpe,
      points: doc.points,
      learnLevel: doc.learnLevel,
      isLearned: doc.isLearned,
      timeDelta: doc.timeDelta,
      daysBetweenReviews: doc.daysBetweenReviews,
      streak: doc.streak,
      isLast: doc.isLast,
      isCorrect: doc.isCorrect,
      isDifficult: doc.isDifficult,
      isRepeat: doc.isRepeat,
      isDeleted: false,
      dt: Date.now(),
      sequence: doc.sequence // To find the last saved doc for docs with same save time
    };
    if (doc.daysBetweenReviews) {
      dtToReview = Date.now();
      dtToReview += 1000 * 60 * 60 * 24 * parseFloat(doc.daysBetweenReviews);
      result.dtToReview = dtToReview;
    }
    if (results.step !== 'practise') {
      result.isLearned = true;
    }
    return result;
  });

  Result.insertMany(docs, function(err, insertResult) {
    response.handleError(err, res, 400, 'Error saving results', function(){
      this.getTotalPoints(userId, (err, score) => {
        response.handleError(err, res, 400, 'Error getting total', function(){
          response.handleSuccess(res, score.toString());
        });
      });
    });
  })
}

getCourseExercisesPipeline = function(courseId, resultData) {
  // piggyback lesson options with exercise for course reviews
  const exerciseIds = resultData.map(item => item.exerciseUnid.exerciseId),
        query = {'exercises._id': {$in: exerciseIds.slice(0, maxExercises)}},
        pipeline = [
          {$match: {courseId}},
          {$unwind: '$exercises'},
          {$match: query},
          {$project: {_id: 0, lessonId:'$_id', exercise: '$exercises', 'options': '$options'}}
        ];

  return pipeline;
}

getCourseExercises = function(courseId, resultData, cb) {
  const pipeline = getCourseExercisesPipeline(courseId, resultData);
  Lesson.aggregate(pipeline, function(err, exercises) {
    const validExercises = [];
    let isInResult;
    // Check if exercises are for correct lesson
    exercises.forEach(exercise => {
      isInResult = resultData.find(data =>
        data.exerciseUnid.exerciseId.toString() === exercise.exercise._id.toString() &&
        data.exerciseUnid.lessonId.toString() === exercise.lessonId.toString()
      );
      if (!!isInResult) {
        validExercises.push(exercise);
      }
    })
    cb(err, validExercises || []);
  });
}

getTotalPoints = function(userId, cb) {
  const scoreCoursespipeline = [
          {$match: {userId}},
          {$group: {
            _id: null,
            totalPoints: {'$sum': '$points'}
          }},
          {$project: {
            _id: 0,
            points: '$totalPoints'
          }},
        ],
        scoreBooksPipeline = [
          {$match: {userId}},
          {$group: {
            _id: null,
            totalPointsWords: {'$sum': '$points.words'},
            totalPointsTranslations: {'$sum': '$points.translations'},
            totalPointsFinished: {'$sum': '$points.finished'}
          }},
          {$project: {
            _id: 0,
            points: {'$add' : [ '$totalPointsWords', '$totalPointsTranslations', '$totalPointsFinished' ]}
          }}
        ];

  const getScores = async () => {
    const courses = await  Result.aggregate(scoreCoursespipeline),
          books = await Session.aggregate(scoreBooksPipeline);

    let score = 0;
    scoreCourses = courses && courses[0] ? courses[0].points : 0;
    scoreBooks = books && books[0] ? books[0].points : 0;
    score = scoreCourses + scoreBooks;
    return {score};
  };

  getScores().then((result) => {
    cb(null, result.score);
  }).catch((err) => {
    console.log(err);
    cb(err, null);
  });
}

getStepCounts = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          sort = {dt: -1, sequence: -1},
          lessonQuery = {
            userId,
            lessonId,
            isDeleted: false,
            isRepeat: false,
            $or: [{isLearned: true}, {step: 'study'}, {step: 'intro'}, {step: 'dialogue'}]
          },
          difficultQuery = {
            userId,
            courseId,
            isLast: true,
            isRepeat: false,
            isLearned: true,
            isDeleted: false
          },
          reviewQuery = {
            userId,
            courseId,
            isLast: true,
            isLearned: true,
            $or: [{step: 'practise'}, {step: 'review'}],
            isRepeat: false,
            isDeleted: false,
            daysBetweenReviews: {$gt: 0}
          },
          lessonPipeline = [
            {$match: lessonQuery},
            {$sort: sort},
            {$group: {
              _id: {exerciseId:'$exerciseId', step: '$step'},
              firstStep: {'$first': '$step'}
            }},
            {$group: {
              _id:'$firstStep',
              nrDone:{'$sum':1}
            }},
            {$project: {
              _id:0,
              step: '$_id',
              nrDone: 1
            }}
          ],
          difficultPipeline = [
            {$match: difficultQuery},
            {$sort: sort},
            {$group: {
              _id: {exerciseId: '$exerciseId', lessonId: '$lessonId'},
              difficult: {'$first': '$isDifficult'}
            }},
            {$match: {difficult: true}},
            {$project: {
              _id:0
            }}
          ],
          reviewPipeline = [
            {$match: reviewQuery},
            {$sort: sort},
            {$group: {
              _id: {exerciseId: '$exerciseId', lessonId: '$lessonId'},
              dtToReview: {'$first': '$dtToReview'},
            }},
            {$match: {dtToReview:{$lte: new Date()}}},
            {$project: {
              _id:0
            }}
          ];

  const lesson = req.params.lessonId ? await Result.aggregate(lessonPipeline) : '',
        difficult = await Result.aggregate(difficultPipeline),
        review = await Result.aggregate(reviewPipeline);
  return {
    lesson,
    difficult: difficult.length,
    review: review.length
  };
};

module.exports = {
  getTotalScore: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    this.getTotalPoints(userId, (err, score) => {
      response.handleError(err, res, 400, 'Error fetching total score', function(){
        response.handleSuccess(res, score.toString());
      });
    })
  },
  getCourseScores: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          pipeline = [
            {$match: {userId}},
            {$group: {
              _id: '$courseId',
              totalPoints: {'$sum': '$points'}
            }},
            {$sort: {'totalPoints': -1}},
            {$lookup: {
              from: 'courses',
              localField: '_id',
              foreignField: '_id',
              as: 'course'
            }},
            {$project: {
              _id: 1,
              course: 1,
              points: '$totalPoints'
            }}
          ];
    Result.aggregate(pipeline, function(err, result) {
      response.handleError(err, res, 400, 'Error fetching score per course', function(){
        let scores = [];
        let total = 0;
        if (result && result.length) {
          result.forEach(doc => {
            if (doc.course[0]) {
              const newDoc = {
                course: doc.course[0].name,
                lan: doc.course[0].languagePair,
                points: doc.points
              };
              total += doc.points;
              scores.push(newDoc);
            }
          })
        }
        response.handleSuccess(res, {scores, total});
      });
    })
  },
  getBookScores: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          pipeline = [
            {$match: {userId}},
            {$group: {
              _id: {
                bookId: '$bookId',
                lan: '$lanCode'
              },
              totalPoints: {'$sum': { $add : [
                '$points.words',
                '$points.translations',
                '$points.finished']
              }}
            }},
            {$sort: {'totalPoints': -1}},
            {$lookup: {
              from: 'books',
              localField: '_id.bookId',
              foreignField: '_id',
              as: 'book'
            }},
            {$project: {
              _id: 1,
              book: 1,
              points: '$totalPoints'
            }}
          ];
    Session.aggregate(pipeline, function(err, result) {
      response.handleError(err, res, 400, 'Error fetching score per book', () => {
        let scores = [];
        let total = 0;
        if (result && result.length) {
          result.forEach(doc => {
            if (doc.book[0]) {
              const newDoc = {
                book: doc.book[0].title,
                lan: {from: doc.book[0].lanCode, to : doc._id.lan},
                points: doc.points
              };
              total += doc.points;
              scores.push(newDoc);
            }
          })
        }
        response.handleSuccess(res, {scores, total});
      });
    })
  },
  saveResults: function(req, res) {
    const results = req.body,
          courseId = new mongoose.Types.ObjectId(results.courseId),
          lessonId = results.lessonId ? new mongoose.Types.ObjectId(results.lessonId) : null,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    switch(results.step) {
      case 'intro':
      case 'dialogue':
        hasIntroStep(res, results, userId, courseId, lessonId, function(hasStep) {
          if (!hasStep) {
            saveIntroStep(res, results, userId, courseId, lessonId);
          } else {
            response.handleSuccess(res, null);
          }
        })
      break;
      case 'study': saveStudy(res, results, userId, courseId, lessonId);
      break;
      default: saveStep(res, results, userId, courseId, lessonId);
    }
  },
  getLessonResults: function(req, res) {
    // Get the results for all the exercises for this lesson
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          step = req.params.step,
          query = {
            userId,
            lessonId,
            isLast: true,
            isRepeat: false,
            isDeleted: false
          };
    if (step === 'practise') {
      query['$or'] = [{step:'study'}, {step:'practise'}];
    } else {
      query.step = step;
    }
    const pipeline = [
            {$match: query},
            {$sort: {dt: -1, sequence: -1}},
            {$group: {
              _id: '$exerciseId',
              firstLevel: {'$first': '$learnLevel'},
              isLearned: {'$first': '$isLearned'},
              streak: {'$first': '$streak'},
              dt: {'$first': '$dt'},
              daysBetweenReviews: {'$first': '$daysBetweenReviews'}
            }},
            {$project: {
              _id: 0,
              exerciseId: '$_id',
              learnLevel: '$firstLevel',
              isLearned: '$isLearned',
              dt: '$dt',
              daysBetweenReviews: '$daysBetweenReviews',
              streak: '$streak'
            }}
          ];
    Result.aggregate(pipeline, function(err, results) {
      response.handleError(err, res, 400, 'Error fetching all results', function(){
        response.handleSuccess(res, {count: results});
      });
    });
  },
  getLessonOverviewResults: function(req, res) {
    // Get lesson results for single lesson in overview page
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          lastQuery = {
            userId,
            lessonId,
            isLast: true,
            isRepeat: false,
            isDeleted: false
          },
          countQuery = {
            userId,
            lessonId,
            isRepeat: false
          },
          lastPipeline = [
            {$match: lastQuery},
            {$sort: {dt: -1, sequence: -1}},
            {$group: {
              _id: '$exerciseId',
              firstLevel: {'$first': '$learnLevel'},
              isLearned: {'$first': '$isLearned'},
              isDifficult: {'$first': '$isDifficult'},
              streak: {'$first': '$streak'},
              dt: {'$first': '$dt'},
              daysBetweenReviews: {'$first': '$daysBetweenReviews'},
              dtToReview: {'$first': '$dtToReview'}
            }},
            {$project: {
              _id: 0,
              exerciseId: '$_id',
              isLearned: '$isLearned',
              learnLevel: '$firstLevel',
              isDifficult: '$isDifficult',
              streak: '$streak',
              dt: '$dt',
              daysBetweenReviews: '$daysBetweenReviews',
              dtToReview: '$dtToReview'
            }}
          ],
          countPipeline = [
            {$match: countQuery},
            {$group: {
              _id: '$exerciseId',
              totalPoints: {'$sum': '$points'},
              timesDone: {'$sum': {$cond: [{$eq: [ "$step", "study"]} , 0, 1]}},
              timesCorrect: {'$sum': {$cond: ["$isCorrect", 1, 0 ]}}
            }},
            {$project: {
              _id: 0,
              exerciseId: '$_id',
              points: '$totalPoints',
              timesDone: '$timesDone',
              timesCorrect: '$timesCorrect'
            }}
          ];

    const getReview = async () => {
      const last = await  Result.aggregate(lastPipeline),
            count = await Result.aggregate(countPipeline);
      return {last, count};
    };

    getReview().then((results) => {
      response.handleSuccess(res, results);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching overview results');
    });

  },
  getResultsByLesson: function(req, res) {
    // Get results + exercise count by lesson for overview page
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          sort = {dt: -1, sequence: -1},
          resultsQuery = {
            userId,
            courseId,
            isLast: true,
            isRepeat: false,
            isDeleted: false
          },
          resultsPipeline = [
            {$match: resultsQuery},
            {$sort: sort},
            {$group: {
              _id: {exerciseId: '$exerciseId', lessonId: '$lessonId'},
              lessonId: {'$first': '$lessonId'},
              firstStep: {'$first': '$step'},
              firstTpe: {'$first': '$tpe'},
              firstIsLearned: {'$first': '$isLearned'}
            }},
            {$group: {
               _id: '$lessonId',
               studied: {'$sum': {$cond: [{$eq: [ "$firstTpe", 0], $eq: [ "$firstStep", 'study']}, 1, 0]}},
               learned: {'$sum': {$cond: ["$firstIsLearned", 1, 0 ]}}
            }}
          ],
          countPipeline = lessons.getCountPipeLine(courseId);// same as lesson.getCountsByLesson
    const getByLesson = async () => {
      const results = await  Result.aggregate(resultsPipeline),
            count = await Lesson.aggregate(countPipeline);
      return {results, count};
    };

    getByLesson().then((data) => {
      data.count.forEach(lesson => {
        resultData = data.results.find(result => lesson._id.toString() === result._id.toString());
        if (resultData && lesson.total) {
          lesson.studied = resultData.studied;
          lesson.learned = resultData.learned;
        }
      })
      response.handleSuccess(res, data.count);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching results by lesson');
    });
  },
  getCurrentLesson: function(req, res) {
    // Get the lesson from the most recent result for a course
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          query = {
            userId,
            courseId,
            isRepeat: false,
            step: {$ne: 'difficult'}
          },
          projection = {_id: 0, lessonId: 1},
          options = {sort: {dt: -1, sequence: -1}};
    Result.findOne(query, projection, options, function(err, result) {
      response.handleError(err, res, 400, 'Error fetching most recent result', function(){
        const lessonId = result ? result.lessonId : null;
        response.handleSuccess(res, lessonId);
      });
    })
  },
  getStepCount: function(req, res) {
    getStepCounts(req, res).then((results) => {
      response.handleSuccess(res, results);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching count steps');
    });
  },
  getDifficult:  function(req, res) {
    const parms = req.query,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          limit = parms.max ? parseInt(parms.max) : 10,
          sort = {dt: -1, sequence: -1},
          query = {
            userId,
            courseId,
            isLast: true,
            isLearned: true,
            isRepeat: false,
            isDeleted: false
          },
          pipeline = [
            {$match: query},
            {$sort: sort},
            {$group: {
              _id: {exerciseId: '$exerciseId', lessonId: '$lessonId'},
              dtToReview: {'$first': '$dtToReview'},
              dt: {'$first': '$dt'},
              streak: {'$first': '$streak'},
              learnLevel: {'$first': '$learnLevel'},
              daysBetweenReviews: {'$first': '$daysBetweenReviews'},
              lessonId: {'$first': '$lessonId'},
              difficult: {'$first': '$isDifficult'}
            }},
            {$match: {difficult: true}},
            {$sample: {size: limit}},
            {$project: {
              _id: 0,
              exerciseUnid: '$_id',
              dtToReview: '$dtToReview',
              dt: '$dt',
              streak: '$streak',
              learnLevel: '$learnLevel',
              daysBetweenReviews: '$daysBetweenReviews',
              lessonId: '$lessonId'
            }}
          ];
    Result.aggregate(pipeline, function(err, results) {
      response.handleError(err, res, 400, 'Error fetching difficult exercise ids', function(){
        getCourseExercises(courseId, results, function(err, difficult) {
          response.handleError(err, res, 400, 'Error fetching difficult exercises', function(){
            // Remove exercises for which there is no result (for duplicate exerciseIds)
            const uniqueExercises = [];
            difficult.forEach(exercise => {
              result = results.find(result => exercise.exercise._id.toString() === result.exerciseUnid.exerciseId.toString() &&
                                              exercise.lessonId.toString() === result.exerciseUnid.lessonId.toString());
              if (result) {
                uniqueExercises.push(exercise);
              }
            });
            response.handleSuccess(res, {difficult: uniqueExercises, results});
          });
        });
      });
    });
  },
  getToReview: function(req, res) {
    // To review is fetched from review of practise steps
    // But for the streak we also need difficult step !!!
    const parms = req.query,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          limit = parms.max ? parseInt(parms.max) : 10,
          sort = {dt: -1, sequence: -1},
          toReviewQuery = {
            userId,
            courseId,
            isLast: true,
            isLearned: true,
            $or: [{step: 'practise'}, {step: 'review'}],
            isRepeat: false,
            isDeleted: false,
            daysBetweenReviews: {$gt: 0}
          },
          latestQuery = {
            userId,
            courseId,
            isLast: true,
            isLearned: true,
            isRepeat: false,
            isDeleted: false
          },
          toReviewPipeline = [
            {$match: toReviewQuery},
            {$sort: sort},
            {$group: {
              _id: {exerciseId: '$exerciseId', lessonId: '$lessonId'},
              dtToReview: {'$first': '$dtToReview'},
              dt: {'$first': '$dt'},
              streak: {'$first': '$streak'},
              learnLevel: {'$first': '$learnLevel'},
              daysBetweenReviews: {'$first': '$daysBetweenReviews'},
              lessonId: {'$first': '$lessonId'}
            }},
            {$sort: {dtToReview: 1}},
            {$match: {dtToReview: {$lte: new Date()}}},
            {$limit: limit},
            {$project: {
              _id: 0,
              exerciseUnid: '$_id',
              dtToReview: '$dtToReview',
              dt: '$dt',
              streak: '$streak',
              learnLevel: '$learnLevel',
              daysBetweenReviews: '$daysBetweenReviews',
              lessonId: '$lessonId'
            }}
          ],
          latestPipeline = [
            {$match: latestQuery},
            {$sort: sort},
            {$group: {
              _id: {exerciseId: '$exerciseId', lessonId: '$lessonId'},
              dtToReview: {'$first': '$dtToReview'},
              dt: {'$first': '$dt'},
              streak: {'$first': '$streak'},
              learnLevel: {'$first': '$learnLevel'},
              daysBetweenReviews: {'$first': '$daysBetweenReviews'},
              difficult: {'$first': '$isDifficult'}
            }},
          ];
    const getReviewData = async (results) => {
      const exercisesPipeline = getCourseExercisesPipeline(courseId, results),
            exercises = await Lesson.aggregate(exercisesPipeline),
            latest = await Result.aggregate(latestPipeline),
            uniqueExercises = [];
      // Check if there is an exerciseId that was not found in any lesson
      if (results.length > exercises.length && results.length < maxExercises) {
        const notFound = results.find(result => !exercises.find(exercise => exercise.exercise._id === result.exerciseUnid.exerciseId));
        if (notFound) {
          // This exercise id does not exist anymore, flag results as deleted
          delExerciseId = new mongoose.Types.ObjectId(notFound.exerciseUnid.exerciseId);
          delLessonId = new mongoose.Types.ObjectId(notFound.exerciseUnid.lessonId);
          exercisesModule.setExercisesAsDeleted(userId, delLessonId, delExerciseId);
          const error = new ErrorModel({
            code: 'ERREXE04',
            src: 'getToReview',
             msg: `ERREXE04: Exercise id "${delExerciseId}" not found in lesson "${delLessonId}"!`,
            module: 'results'
          });
          error.save(function(err, result) {});
        }
      }
      // Remove exercises for which there is no result (for duplicate exerciseIds)
      exercises.forEach(exercise => {
        result = results.find(result => exercise.exercise._id.toString() === result.exerciseUnid.exerciseId.toString() &&
                                        exercise.lessonId.toString() === result.exerciseUnid.lessonId.toString());
        if (result) {
          uniqueExercises.push(exercise);
        }
      });

      // Combine data (so that data from difficult tests is added to result)
      let latestOne;
      results.forEach(result => {
        latestOne = latest.find(l => l._id.exerciseId.toString() === result.exerciseUnid.exerciseId.toString() &&
                                     l._id.lessonId.toString() === result.exerciseUnid.lessonId.toString());
        if (latestOne) {
          result.streak = latestOne.streak;
          result.learnLevel = latestOne.learnLevel;
        }
      })

      return {exercises: uniqueExercises || [], latest};
    };

    Result.aggregate(toReviewPipeline, function(err, results) {
      response.handleError(err, res, 400, 'Error fetching to review exercise ids', function(){
        getReviewData(results).then((data) => {
          response.handleSuccess(res, {toreview: data.exercises, results});
        }).catch((err) => {
          response.handleError(err, res, 400, 'Error fetching to review results');
        });
      });
    });
  },
  getCourseSummary: function(req, res) {
    getStepCounts(req, res).then((results) => {
      response.handleSuccess(res, results);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching count steps');
    });
  },
  getCourseCount: function(req, res) {
    const learnLevel = 12,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          query = {
            userId,
            courseId,
            step: 'practise',
            isLearned: true,
            isRepeat: false,
            isDeleted: false
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: {exerciseId: '$exerciseId', lessonId: '$lessonId'},
              tpe: {$first: {$cond: [{$eq: [ "$tpe", 0]} , 0, 1]}}, // word or exercise
            }},
            {$group: {
              _id: '$tpe',
              cnt: {'$sum': 1},
            }},
            {$project: {
              _id: 0,
              tpe: '$_id',
              cnt: '$cnt'
            }}
          ];
    Result.aggregate(pipeline, function(err, results) {
      response.handleError(err, res, 400, 'Error fetching course count', function() {
        countPerTpe = [0, 0];
        results.forEach(result => {
          countPerTpe[result.tpe] = result.cnt || 0;
        })
        response.handleSuccess(res, countPerTpe);
      });
    });
  }
}
