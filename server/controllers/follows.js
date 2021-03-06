'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      users = require('./users'),
      Follow = require('../models/follow');

module.exports = {
  followUser: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          userIdToFollow = new mongoose.Types.ObjectId(req.body.userId),
          query = {userId, followId: userIdToFollow},
          update = {follow: true};
    Follow.findOneAndUpdate(query, update, {upsert: true}, (err, result) => {
      response.handleError(err, res, 400, 'Error following user', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  unFollowUser: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          userIdToUnFollow = new mongoose.Types.ObjectId(req.body.userId),
          query = {userId, followId: userIdToUnFollow},
          update = {follow: false};
    Follow.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error unfollowing user', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  getFollowers: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.params.userId),
          follows = {};
    let query = {userId, follow: true},
        projection = {_id: 0, followId: 1};

    Follow.find(query, projection, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching following', () => {
        follows.following = result.map(user => user.followId);
        query = {followId: userId, follow: true},
        projection = {_id: 0, userId:1};
        Follow.find(query, projection, (err, result) => {
          follows.followers = result.map(user => user.userId);
          response.handleError(err, res, 400, 'Error fetching followers', () => {
            response.handleSuccess(res, follows);
          });
        });
      });
    });
  },
  getFollowing: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, follow: true},
          projection = {_id: 0, followId: 1};
    Follow.find(query, projection, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching following', () => {
        const following = result.map(user => user.followId);
        response.handleSuccess(res, following);
      });
    });
  },
  getRecipients: (req, res) => {
    // Get users current user can message to
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {followId: userId, follow: true},
          projection = {_id: 0, userId: 1};
    Follow.find(query, projection, (err, recipients) => {
      response.handleError(err, res, 400, 'Error fetching recipients', () => {
        users.getMailData(req, res, recipients);
      });
    });
  }
  /*
  getTwoWayFollowers: (req, res) => {
    // Get users current user can mail to
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          pipeline = [
            {$match: {$or:[{followId: mongoose.Types.ObjectId(userId)}, {userId: mongoose.Types.ObjectId(userId)}], follow: true}},
            {$group: {_id: { a: "$followId", b: "$userId"}}},
            {$match: {"_id.b": mongoose.Types.ObjectId(userId)}},
            {$project: {_id:0, recipient: '$_id.a'}}
          ];
    Follow.aggregate(pipeline, (err, recipients) => {
      response.handleError(err, res, 400, 'Error fetching recipients', () => {
        users.getMailData(req, res, recipients);
      });
    })
  }
  */
}
