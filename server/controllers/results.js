const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result');

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
        step: 'study'
      };
      return {
        updateOne: {
          filter: filterObj,
          update: {
            $set: filterObj,
            $setOnInsert: {
              points: doc.points,
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
    result = {
      userId,
      courseId,
      lessonId,
      exerciseId,
      step: results.step,
      points: doc.points,
      learnLevel: doc.learnLevel,
      isLearned: doc.isLearned,
      daysBetweenReviews: doc.daysBetweenReviews,
      percentOverdue: doc.percentOverdue,
      dt: Date.now(),
      sequence: doc.sequence // To find the last saved doc for docs with same save time
    };
    if (doc.daysBetweenReviews) {
      dtToReview = Date.now();
      dtToReview += 1000 * 60 * 60 * 24 * parseFloat(doc.daysBetweenReviews);
      result.dtToReview = dtToReview;
    }
    return result;
  });
  console.log('results', docs);

  Result.insertMany(docs, function(err, insertResult) {
    response.handleError(err, res, 500, 'Error saving results', function(){
      response.handleSuccess(res, insertResult, 200, 'Saved results');
    });
  })
}

module.exports = {
  saveResults: function(req, res) {
    const results = req.body,
          courseId = new mongoose.Types.ObjectId(results.courseId),
          lessonId = new mongoose.Types.ObjectId(results.lessonId),
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
          query = {userId, lessonId};

    if (step === 'practise') {
      query['$or'] = [{step:'study'}, {step:'practise'}];
    } else if (step !== 'all') {
      query.step = step;
    }
    const pipeline = [
      {$match: query},
      {$sort: {dt: -1, sequence: -1}},
      {$group: {
        _id: '$exerciseId',
        firstLevel: {'$first': '$learnLevel'},
        isLearned: {'$first': '$isLearned'},
        dt: {'$first': '$dt'},
        daysBetweenReviews: {'$first': '$daysBetweenReviews'},
        totalPoints: {'$sum': '$points'}
      }},
      {$project: {
        _id: 0,
        exerciseId: '$_id',
        learnLevel: '$firstLevel',
        isLearned: '$isLearned',
        dt: '$dt',
        daysBetweenReviews: '$daysBetweenReviews',
        points: '$totalPoints'
      }}
    ];
    Result.aggregate(pipeline, function(err, results) {
      console.log('resultALL', query);
      console.log('resultALL', results);
      response.handleError(err, res, 500, 'Error fetching all results', function(){
        response.handleSuccess(res, results, 200, 'Fetched all results');
      });
    });
  },
  getCurrentLesson: function(req, res) {
    // Get the lesson from the most recent result for a course
    console.log('getting current lesson');
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId);
    Result.findOne({courseId}, {_id: 0, lessonId: 1}, {sort: {dt: -1, sequence: -1}}, function(err, result) {
    console.log('current lesson', result);
      response.handleError(err, res, 500, 'Error fetching most recent result', function(){
        response.handleSuccess(res, result, 200, 'Fetched most recent result');
      });
    })
  },
  getResultsDone: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {userId, lessonId, $or: [{isLearned: true}, {step: 'study'}]};
    console.log('getting results done', userId, lessonId, query);
    const pipeline = [
      {$match: query},
      {$group: {
        _id: {exerciseId:'$exerciseId', step: '$step'},
        firstStep: {'$first': '$step'},
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

    Result.aggregate(pipeline, function(err, results) {
      console.log('resultDone', results);
      response.handleError(err, res, 500, 'Error fetching done results', function(){
        response.handleSuccess(res, results, 200, 'Fetched done results');
      });
    });
  },
  getToReview: function(req, res) {
    const parms = req.query,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          courseId = new mongoose.Types.ObjectId(req.params.courseId),
          limit = parms.max ? parseInt(parms.max) : 10,
          query = {userId, courseId, isLearned: true};

    const pipeline = [
      {$match: query},
      {$sort: {dtToReview: -1}},
      {$limit: limit},
      {$group: {
        _id: '$exerciseId',
        dtToReview: {'$first': '$dtToReview'},
        dt: {'$first': '$dt'},
        daysBetweenReviews: {'$first': '$daysBetweenReviews'}
      }},
      {$project: {
        _id: 0,
        exerciseId: '$_id',
        dtToReview: '$dtToReview',
        dt: '$dt',
        daysBetweenReviews: '$daysBetweenReviews'
      }}
    ];
    console.log('getting data for review for course', courseId, 'limit:', limit);

    Result.aggregate(pipeline, function(err, results) {
      console.log('resultsToReview', results);
      response.handleError(err, res, 500, 'Error fetching to review results', function(){
        response.handleSuccess(res, results, 200, 'Fetched to review results');
      });
    });
  }
}
