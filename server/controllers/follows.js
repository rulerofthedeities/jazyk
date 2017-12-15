const response = require('../response'),
      mongoose = require('mongoose'),
      users = require('./users'),
      Follow = require('../models/follow');

module.exports = {
  followUser: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          userIdToFollow = new mongoose.Types.ObjectId(req.body.userId),
          query = {userId, followId: userIdToFollow},
          update = {follow: true};
    Follow.findOneAndUpdate(query, update, {upsert: true}, (err, result) => {
      response.handleError(err, res, 500, 'Error following user', () => {
        response.handleSuccess(res, true, 200, 'Followed user');
      });
    });
  },
  unFollowUser: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          userIdToUnFollow = new mongoose.Types.ObjectId(req.body.userId),
          query = {userId, followId: userIdToUnFollow},
          update = {follow: false};
    console.log('unfollowing', query);
    Follow.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 500, 'Error unfollowing user', () => {
        response.handleSuccess(res, false, 200, 'Unfollowed user');
      });
    });
  },
  getFollowers: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.params.userId),
          follows = {};
    let query = {userId: new mongoose.Types.ObjectId(req.params.userId), follow: true},
        projection = {_id: 0, followId:1};

    Follow.find(query, projection, (err, result) => {
      response.handleError(err, res, 500, 'Error fetching followers', () => {
        follows.follows = result;
        query = {followId: new mongoose.Types.ObjectId(req.params.userId), follow: true},
        projection = {_id: 0, userId:1};
        Follow.find(query, projection, (err, result) => {
          follows.followed = result;
          response.handleError(err, res, 500, 'Error fetching followed', () => {
            response.handleSuccess(res, follows, 200, 'Fetched followers');
          });
        });
      });
    });
  },
  getTwoWayFollowers: function(req, res) {
    // Get users current user can mail to
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          pipeline = [
            {$match: {$or:[{followId: mongoose.Types.ObjectId(userId)}, {userId: mongoose.Types.ObjectId(userId)}], follow: true}},
            {$group: {_id: { a: "$followId", b: "$userId"}}},
            {$match: {"_id.b": mongoose.Types.ObjectId(userId)}},
            {$project: {_id:0, recipient: '$_id.a'}}
          ];
    Follow.aggregate(pipeline, function(err, recipients) {
      response.handleError(err, res, 500, 'Error fetching recipients', () => {
        users.getMailData(req, res, recipients);
      });
    })
  },
}
