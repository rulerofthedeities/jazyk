const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result');

saveStudy = function(res, results, userId, courseId) {
  let exerciseId, filterObj;
  const docs = results.data.map(doc => 
  { 
    exerciseId = new mongoose.Types.ObjectId(doc.exerciseId);
    filterObj = {
      userId,
      courseId,
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

saveStep = function(res, results, userId, courseId) {
  let exerciseId, result;
  console.log('results', results);
  const docs = results.data.map(doc => 
  { 
    exerciseId = new mongoose.Types.ObjectId(doc.exerciseId);
    result = {
      userId,
      courseId,
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
          userId = req.decoded.user._id;
    if (results.step === 'study') {
      saveStudy(res, results, userId, courseId);
    } else {
      saveStep(res, results, userId, courseId);
    }
  },
  getLastResults: function(req, res) {
    const parms = req.query,
          exerciseIds = [],
          step = req.params.step, // ignored
          userId = req.decoded.user._id,
          courseId = new mongoose.Types.ObjectId(req.params.courseId);
    let exerciseId;
    for (var key in parms) {
      if (parms[key]) {
        exerciseId = new mongoose.Types.ObjectId(parms[key]);
        exerciseIds.push(exerciseId);
      }
    }
    console.log('ids', exerciseIds);
    const query = {userId, courseId, exerciseId: {$in: exerciseIds}};

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
      console.log('result', results);
      response.handleError(err, res, 500, 'Error fetching results', function(){
        response.handleSuccess(res, results, 200, 'Fetched results');
      });
    });
  },
  getResultsDone: function(req, res) {
    const userId = req.decoded.user._id,
          courseId = new mongoose.Types.ObjectId(req.params.courseId);
    const pipeline = [
      {$match: {userId, courseId}},
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
      console.log('step count', results);
      response.handleError(err, res, 500, 'Error fetching done results', function(){
        response.handleSuccess(res, results, 200, 'Fetched done results');
      });
    });
  }
}
