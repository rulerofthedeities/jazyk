const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result'),
      Lesson = require('../models/lesson');

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
              isLast: true,
              dt: new Date()
            }
          },
          upsert: true
        }
      }
    })
    console.log('results', results, docs);
    Result.collection.bulkWrite(docs, function(err, bulkResult) {
      response.handleError(err, res, 500, 'Error saving user results for study', function(){
        response.handleSuccess(res, bulkResult, 200, 'Saved user results for study');
      });
    })
  } else {
    response.handleSuccess(res, null, 200, 'No results to save');
  }
}

saveStep = function(res, results, userId, courseId, lessonId) {
  let exerciseId, result, dtToReview;
  console.log('saving results', results);
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
      daysBetweenReviews: doc.daysBetweenReviews,
      percentOverdue: doc.percentOverdue,
      streak: doc.streak,
      isLast: doc.isLast,
      isCorrect: doc.isCorrect,
      isDifficult: doc.isDifficult,
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
  console.log('results', docs);

  Result.insertMany(docs, function(err, insertResult) {
    response.handleError(err, res, 500, 'Error saving results', function(){
      this.getTotal(userId, (err, result) => {
        score = result && result.length ? result[0].points : 0;
        response.handleError(err, res, 500, 'Error getting total', function(){
          response.handleSuccess(res, score, 200, 'Saved results & got total');
        });
      });
    });
  })
}

getExercises = function(courseId, data, cb) {
  const exerciseIds = data.map(item => item.exerciseId),
        query = {'exercises._id': {$in: exerciseIds}},
        pipeline = [
          {$match: {courseId}},
          {$unwind: '$exercises'},
          {$match: query},
          {$project: {_id: 0, exercise: '$exercises'}},
          {$replaceRoot: {newRoot: "$exercise"}}
        ];
  Lesson.aggregate(pipeline, function(err, exercises) {
    cb(err, exercises || []);
  });
}

getTotal = function(userId, cb) {
  const pipeline = [
          {$match: {userId}},
          {$group: {
            _id: null,
            totalPoints: {'$sum': '$points'}
          }},
          {$project: {
            _id: 0,
            points: '$totalPoints'
          }}
        ];
  Result.aggregate(pipeline, function(err, result) {
    cb(err, result);
  });
}

module.exports = {  
  getTotalScore: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    this.getTotal(userId, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching total score', function(){
        score = result && result.length ? result[0].points : 0;
        response.handleSuccess(res, score, 200, 'Fetched total score');
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
            {$lookup: {
              from: 'courses',
              localField: '_id',
              foreignField: '_id',
              as: 'course'
            }},
            {$sort: {'points':1}},
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
                lan: doc.course[0].languagePair.to,
                points: doc.points
              };
              total += doc.points;
              scores.push(newDoc);
            }
          })
        }
        response.handleSuccess(res, {scores, total}, 200, 'Fetched score per course');
      });
    })
  },
  saveResults: function(req, res) {
    const results = req.body,
          courseId = new mongoose.Types.ObjectId(results.courseId),
          lessonId = results.lessonId ? new mongoose.Types.ObjectId(results.lessonId) : null,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    if (results.step === 'study') {
      saveStudy(res, results, userId, courseId, lessonId);
    } else {
      saveStep(res, results, userId, courseId, lessonId);
    }
  },
  getLastResults: function(req, res) {
    // Get the learn level of the most recent exercises for this lesson
    const parms = req.query,
          exerciseIds = [],
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId);
    let exerciseId;
    for (var key in parms) {
      if (parms[key]) {
        exerciseId = new mongoose.Types.ObjectId(parms[key]);
        exerciseIds.push(exerciseId);
      }
    }
    console.log('ids', userId, lessonId, exerciseIds);
    const query = {userId, lessonId, step: {$ne:'study'}, exerciseId: {$in: exerciseIds}};

    const pipeline = [
      {$match: query},
      {$sort: {dt: -1, sequence: -1}},
      {$group: {
        _id: '$exerciseId',
        firstLevel: {'$first': '$learnLevel'},
        totalPoints: {'$sum': '$points'}
      }},
      {$project: {
        _id: 0,
        exerciseId: '$_id',
        learnLevel: '$firstLevel',
        points: '$totalPoints'
      }}
    ];

    Result.aggregate(pipeline, function(err, results) {
      console.log('resultLast', results);
      response.handleError(err, res, 500, 'Error fetching results', function(){
        response.handleSuccess(res, results, 200, 'Fetched results');
      });
    });
  },
  getLessonResults: function(req, res) {
    // Get the results for all the exercises for this lesson
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          step = req.params.step,
          query = {userId, lessonId, isLast: true};

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
      response.handleError(err, res, 500, 'Error fetching all results', function(){
        response.handleSuccess(res, results, 200, 'Fetched all results');
      });
    });
  },
  getLessonOverviewResults: function(req, res) {
    // Get lesson results for overview page
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          lastQuery = {userId, lessonId, isLast: true},
          countQuery = {userId, lessonId};
    console.log('fetching overview for lesson id', lessonId);
    const lastPipeline = [
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
      }},
      {$project: {
        _id: 0,
        exerciseId: '$_id',
        isLearned: '$isLearned',
        learnLevel: '$firstLevel',
        isDifficult: '$isDifficult',
        dt: '$dt',
        daysBetweenReviews: '$daysBetweenReviews',
        streak: '$streak',
      }}
    ];
    const countPipeline = [
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
      const last = await  Result.aggregate(lastPipeline);
      const count = await Result.aggregate(countPipeline);
      return {last, count};
    };

    getReview().then((results) => {
      response.handleSuccess(res, results, 200, 'Fetched overview results');
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching overview results');
    });

  },
  getCurrentLesson: function(req, res) {
    // Get the lesson from the most recent result for a course
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          query = {userId, courseId, step: {$ne: 'difficult'}},
          projection = {_id: 0, lessonId: 1},
          options = {sort: {dt: -1, sequence: -1}};
    Result.findOne(query, projection, options, function(err, result) {
      console.log('current lesson', result);
      response.handleError(err, res, 500, 'Error fetching most recent result', function(){
        response.handleSuccess(res, result, 200, 'Fetched most recent result');
      });
    })
  },
  getStepCount: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          sort = {dt:-1, sequence: -1},
          lessonQuery = {userId, lessonId, $or: [{isLearned: true}, {step: 'study'}]},
          difficultQuery = {userId, courseId, isLast: true},
          reviewQuery = {userId, courseId, isLast: true, isLearned: true};
    const lessonPipeline = [
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
    ];
    const difficultPipeline = [
      {$match: difficultQuery},
      {$sort: sort},
      {$group: {
        _id: '$exerciseId',
        difficult: {'$first': '$isDifficult'}
      }},
      {$match: {difficult: true}},
      {$project: {
        _id:0
      }}
    ];
    const reviewPipeline = [
      {$match: reviewQuery},
      {$sort: sort},
      {$group: {
        _id: '$exerciseId',
        dtToReview: {'$first': '$dtToReview'},
      }},
      {$match: {dtToReview:{$lte: new Date()}}},
      {$project: {
        _id:0
      }}
    ];
    const getCount = async () => {
      const lesson = await  Result.aggregate(lessonPipeline),
            difficult = await Result.aggregate(difficultPipeline),
            review = await Result.aggregate(reviewPipeline);
      return {
        lesson,
        difficult: difficult.length,
        review: review.length
      };
    };

    getCount().then((results) => {
      response.handleSuccess(res, results, 200, 'Fetched count steps');
    }).catch((err) => {
      response.handleError(err, res, 500, 'Error fetching count steps');
    });

  },
  getDifficult:  function(req, res) {
    const parms = req.query,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          limit = parms.max ? parseInt(parms.max) : 10,
          sort = {dt:-1, sequence: -1},
          query = {userId, courseId, isLast: true};

    const pipeline = [
      {$match: query},
      {$sort: sort},
      {$group: {
        _id: '$exerciseId',
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
        exerciseId: '$_id',
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
        getExercises(courseId, results, function(err, difficult) {
          response.handleError(err, res, 400, 'Error fetching difficult exercises', function(){
            response.handleSuccess(res, {difficult, results}, 200, 'Fetched difficult exercises');
          });
        });
      });
    });
  },
  getToReview: function(req, res) {
    const parms = req.query,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          limit = parms.max ? parseInt(parms.max) : 10,
          sort = {dt:-1, sequence: -1},
          query = {userId, courseId, isLast: true, isLearned: true};
    console.log('date', new Date(), query);
    const pipeline = [
      {$match: query},
      {$sort: sort},
      {$group: {
        _id: '$exerciseId',
        dtToReview: {'$first': '$dtToReview'},
        dt: {'$first': '$dt'},
        streak: {'$first': '$streak'},
        learnLevel: {'$first': '$learnLevel'},
        daysBetweenReviews: {'$first': '$daysBetweenReviews'},
        lessonId: {'$first': '$lessonId'}
      }},
      {$match: {dtToReview:{$lte: new Date()}}},
      {$sort: {dtToReview: 1}},
      {$limit: limit},
      {$project: {
        _id: 0,
        exerciseId: '$_id',
        dtToReview: '$dtToReview',
        dt: '$dt',
        streak: '$streak',
        learnLevel: '$learnLevel',
        daysBetweenReviews: '$daysBetweenReviews',
        lessonId: '$lessonId'
      }}
    ];

    Result.aggregate(pipeline, function(err, results) {
      response.handleError(err, res, 400, 'Error fetching to review exercise ids', function(){
        getExercises(courseId, results, function(err, toreview) {
          response.handleError(err, res, 400, 'Error fetching to review exercises', function(){
            response.handleSuccess(res, {toreview, results}, 200, 'Fetched to review exercises');
          });
        });
      });
    });
  }
}
