const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result');

saveStudy = function(res, results, userId, courseId, lessonId) {
  let exerciseId, filterObj;
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
}

saveStep = function(res, results, userId, courseId, lessonId) {
  let exerciseId, result;
  console.log('results', results);
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
      dt: new Date(),
      sequence: doc.sequence // To find the last saved doc for docs with same save time
    };
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
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId);
    const pipeline = [
      {$match: {userId, lessonId}},
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
  }
}
