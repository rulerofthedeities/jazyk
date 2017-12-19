const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result'),
      UserCourse = require('../models/usercourse').model;

module.exports = {
  getCount: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          scorePipeline = [
            {$match: {userId}},
            {$group: {
              _id: null,
              totalPoints: {'$sum': '$points'}
            }},
            {$project: {
              _id: 0,
              points: '$totalPoints'
            }}
          ],
          coursesLearningPipeline = [
            {$match: {userId}},
            {$group: {
              _id: null,
              countSubscribed: {'$sum': {$cond: ["$subscribed", 1, 0]}},
              countNotSubscribed: {'$sum': {$cond: ["$subscribed", 0, 1]}}
            }}
          ];

    const getCount = async () => {
      const score = await Result.aggregate(scorePipeline),
            coursesLearning = await UserCourse.aggregate(coursesLearningPipeline),
            subscribed = coursesLearning[0] ? coursesLearning[0].countSubscribed : 0,
            notSubscribed = coursesLearning[0] ? coursesLearning[0].countNotSubscribed : 0,
            points = score[0] ? score[0].points : 0;
      return {
        score: points,
        coursesLearning: {subscribed, notSubscribed}
      };
    };

    getCount().then((results) => {
      response.handleSuccess(res, results, 200, 'Fetched dashboard count data');
    }).catch((err) => {
      response.handleError(err, res, 500, 'Error fetching dashboard count data');
    });
  }
}