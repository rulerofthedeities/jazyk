'use strict';

const response = require('../response'),
      user = require('./users'),
      mongoose = require('mongoose'),
      User = require('../models/user').model;

const getPublicProfile = (query, res) => {
  const projection = {
    'jazyk.profile': 1,
    'jazyk.dt': 1,
    userName: 1,
    email: 1
  };
  User.findOne(query, projection, (err, result) => {
    let errCode = 400;
    if (!result) {
      err = {msg: '404 not found'};
      errCode = 404;
    }
    response.handleError(err, res, errCode, 'Error fetching public profile', () => {
      const publicProfile = JSON.parse(JSON.stringify(result.jazyk));
      publicProfile.userName = result.userName;
      publicProfile.dtJoined = result.jazyk.dt.joined;
      publicProfile._id = result._id;
      publicProfile.email = result.email;
      user.commonSetEmailHash(publicProfile);
      response.handleSuccess(res, publicProfile);
    });
  });
};

module.exports = {
  getProfile: (req, res) => {
    const userId = req.decoded.user._id,
          query = {_id: userId},
          projection = {_id: 0, 'jazyk.profile': 1};
    User.findOne(query, projection, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching profile', () => {
        response.handleSuccess(res, result.jazyk.profile);
      });
    });
  },
  getCompactProfiles: (req, res) => {
    const userIds = req.body.userIds,
          query = {_id: {$in: userIds}},
          projection = {userName: 1, email: 1};
    User.find(query, projection, (err, users) => {
      response.handleError(err, res, 400, 'Error fetching users', () => {
        users.forEach(emailUser => user.commonSetEmailHash(emailUser));
        response.handleSuccess(res, users);
      });
    });
  },
  saveProfile: (req, res) => {
    const userId = req.decoded.user._id,
          profile = req.body,
          query = {_id: userId},
          updateObj = {$set: {'jazyk.profile': profile}};
    User.findOneAndUpdate(query, updateObj, (err, result) => {
      response.handleError(err, res, 400, 'Error updating profile', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  getPublicProfile: (req, res) => {
    const userName = req.params.userName,
          query = {userName};
    getPublicProfile(query, res);
  },
  getPublicProfileById: (req, res) => {
    if (mongoose.Types.ObjectId.isValid(req.params.userId)) {
      const query = {_id: req.params.userId};
      getPublicProfile(query, res);
    } else {
      const err = 'Invalid user id';
      response.handleError(err, res, 400, err);
    }
  }
}
