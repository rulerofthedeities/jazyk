const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result');

saveStudy = function(res, results, userId, courseId) {
  let exerciseId;
  const docs = results.data.map(doc => 
  { 
    exerciseId = new mongoose.Types.ObjectId(doc.exerciseId);
    return {
      updateOne: {
        filter: {
          userId,
          courseId,
          exerciseId,
          step: 'study'
        },
        update: {
          $set: {
            userId,
            courseId,
            exerciseId,
            step: 'study'
          },
          $setOnInsert: {
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
      dt: new Date()
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
          userId = new mongoose.Types.ObjectId(results.userId);
    if (results.step === 'study') {
      saveStudy(res, results, userId, courseId);
    } else {
      saveStep(res, results, userId, courseId);
    }
  },
  getResults: function(req, res) {
    const parms = req.query,
          exerciseIds = [],
          userId = new mongoose.Types.ObjectId(req.params.userId),
          courseId = new mongoose.Types.ObjectId(req.params.courseId);
    let limit, exerciseId;
    for (var key in parms) {
      if (parms[key]) {
        exerciseId = new mongoose.Types.ObjectId(parms[key]);
        exerciseIds.push(exerciseId);
      }
    }
    limit = exerciseIds.length;
    console.log('ids', exerciseIds);
    const query = {userId, courseId, exerciseId: {$in:exerciseIds}};

    Result.find(query, {_id:0, exerciseId:1, study: 1}, {limit}, function(err, results) {
      console.log('result', results);
      response.handleError(err, res, 500, 'Error fetching results', function(){
        response.handleSuccess(res, results, 200, 'Fetched results');
      });
    });
  }
}
