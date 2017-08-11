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
          update: {$set:{
            userId,
            courseId,
            exerciseId,
            study: result.result}
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
  }
}
