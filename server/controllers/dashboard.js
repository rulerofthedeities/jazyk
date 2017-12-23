const response = require('../response'),
      mongoose = require('mongoose'),
      Result = require('../models/result'),
      Course = require('../models/course').model,
      UserCourse = require('../models/usercourse').model,
      Message = require('../models/message'),
      Notification = require('../models/notification');

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
            subscribed = coursesLearning[0] ? coursesLearning[0].countSubscribed || 0 : 0,
            unsubscribed = coursesLearning[0] ? coursesLearning[0].countNotSubscribed || 0 : 0,
            points = score[0] ? score[0].points || 0 : 0;
      return {
        score: points,
        coursesLearning: {
          subscribed,
          unsubscribed,
          total: subscribed + unsubscribed
        }
      };
    };

    getCount().then((results) => {
      response.handleSuccess(res, results, 200, 'Fetched dashboard count data');
    }).catch((err) => {
      response.handleError(err, res, 500, 'Error fetching dashboard count data');
    });
  },
  getCommunication: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          max = req.params.max || '5',
          options = {limit: parseInt(max, 10), sort: {dt: -1}},
          messageQuery = {
            'recipient.id': userId,
            'recipient.trash': false,
            'recipient.deleted': false
          },
          notificationQuery = {userId},
          notificationProjection = {title: 1, read: 1, dt: 1};
    const getCommunication = async () => {
      const messages = await Message.find(messageQuery, {}, options),
            notifications = await Notification.find(notificationQuery, notificationProjection, options);
      return {messages, notifications};
    };

    getCommunication().then((results) => {
      response.handleSuccess(res, results, 200, 'Fetched dashboard communications data');
    }).catch((err) => {
      response.handleError(err, res, 500, 'Error fetching dashboard communications data');
    });
  },
  recentCourses: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          max = req.params.max || '3',
          resultsPipeline = [
            {$match: {userId}},
            {$sort: {dt: -1, sequence: -1}},
            {$group: {
              _id: '$courseId',
              firstDate: {'$first': '$dt'},
            }},
            {$limit: parseInt(max, 10)},
            {$project: {
              _id: 0,
              courseId: '$_id',
              dt: '$firstDate'
            }}
          ];
    Result.aggregate(resultsPipeline, function(err, idResults) {
      response.handleError(err, res, 500, 'Error fetching recent courseIds from results', function() {
        if (idResults) {
          const courseIdArr = [];
          idResults.forEach(result => {
            courseIdArr.push(new mongoose.Types.ObjectId(result.courseId));
          })
          const query = {_id: {$in: courseIdArr}};
          Course.find(query, function(err, courseResults) {
            response.handleError(err, res, 500, 'Error fetching recent courses', function() {
              const recentCourses = [];
              // Add date last result for each course
              courseResults.forEach((course, i, courses) => {
                id = idResults.find(result => result.courseId.toString() === course._id.toString());
                if (id) {
                  recentCourses.push({dt: id.dt, course})
                }
              });
              response.handleSuccess(res, recentCourses, 200, 'Fetched most recent courses');
            });
          });
        } else {
          response.handleSuccess(res, [], 200, 'No courses found');
        }
      });
    });
  }
}
