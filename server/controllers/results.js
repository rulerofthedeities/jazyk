const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result');

module.exports = {
  saveResults: function(req, res) {
    let exerciseId;
    const results = req.body,
          courseId = new mongoose.Types.ObjectId(results.courseId),
          userId = new mongoose.Types.ObjectId(results.userId),
          docs = results.data.map(result => 
    { 
      exerciseId = new mongoose.Types.ObjectId(result.exerciseId);
      return {
        updateOne: {
          filter: {
            userId,
            courseId,
            exerciseId,
          },
          update: {
            $set: {
              userId,
              courseId,
              exerciseId,
              study: result.result
            },
            $setOnInsert: {
              dtCreated: new Date()
            }
          },
          upsert: true
        }
      }
    })

    console.log('results', docs);

    Result.collection.bulkWrite(docs, function(err, result) {
      response.handleError(err, res, 500, 'Error saving user results', function(){
        response.handleSuccess(res, result, 200, 'Saved user results');
      });
    })
  },
  getResults: function(req, res) {
    const parms = req.query,
          exerciseIds = [],
          userId = new mongoose.Types.ObjectId(req.params.userId),
          courseId = new mongoose.Types.ObjectId(req.params.courseId);
    let limit, exerciseId;
    console.log('ids', parms);
    for (var key in parms) {
      if (parms[key]) {
        exerciseId = new mongoose.Types.ObjectId(parms[key]);
        exerciseIds.push(exerciseId);
      }
    }
    limit = exerciseIds.length;
    const query = {userId, courseId, exerciseId: {$in:exerciseIds}};

    Result.find(query, {limit}, {}, function(err, results) {
      console.log('result', results);
      response.handleError(err, res, 500, 'Error fetching results', function(){
        response.handleSuccess(res, results, 200, 'Fetched results');
      });
    });
  }
}
