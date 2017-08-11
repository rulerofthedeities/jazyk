const response = require('../response'),
      mongoose = require('mongoose'),
      jwt = require('jsonwebtoken'),
      scrypt = require('scrypt'),
      User = require('../models/user')

var addUser = function(body, callback) {
  const key = body.password;
  console.log('adding', body);
  scrypt.kdf(key, {N: 1, r:1, p:1}, function(err, hash) {
    const user = new User({
          userName: body.userName,
          password: hash.toString('base64'),
          email: body.email,
          lan: body.lan,
          jazyk: {learnLan: body.jazyk.learnLan},
          vocabulator: {learnLan: body.vocabulator.learnLan},
          grammator: {learnLan: body.grammator.learnLan}
        });
    user.save(function(err, result) {
      console.log('saved', err, result);
      callback(err, result);
    });
  });
};

var findUser = function(body, expiresIn, callback) {
  User.findOne({email: body.email}, {_id: 1, userName: 1, email: 1, password: 1, lan: 1, 'jazyk.learnLan': 1}, function (err, doc) {
    if (err) {
      callback(err, doc, 401, 'Error finding user')
    }
    if (!doc) {
      callback({error: 'Usernamenotfound'}, doc, 401, 'User could not be found')
    } else {
      scrypt.verifyKdf(new Buffer(doc.password, 'base64'), body.password, function(err, result) {
        if (result !== true) {
          callback({error: 'Incorrectpw'}, doc, 401, 'Sign in failed');
        } else {
          doc.password = undefined;
          var token = jwt.sign({user: doc}, process.env.JWT_TOKEN_SECRET, {expiresIn: expiresIn});
          callback(null, {message: 'Success', token: token, user: doc});
        }
      });
    }
  })
};

var isUniqueEmail = function(options, callback) {
  console.log('checking unique email');
  User.findOne({email: options.mail}, function(err, doc) {
    callback(err, doc !== null);
  });
}

var isUniqueUser = function(options, callback) {
  console.log('checking unique username');
  User.findOne({userName: options.user}, function(err, doc) {
    callback(err, doc !== null);
  });
}

var getUserData = function(userId, callback) {
  User.findOne({_id: userId}, {_id: 1, userName: 1, lan: 1, 'jazyk.learnLan': 1}, function(err, doc) {
    callback(err, doc);
  });
}

module.exports = {
  signup: function(req, res) {
    console.log('signing up');
    addUser(req.body, function(err, doc) {
      response.handleError(err, res, 500, 'Error creating new user', function(){
        response.handleSuccess(res, doc, 200, 'Created new user');
      });
    });
  },
  signin: function(req, res) {
    findUser(req.body, req.expiresIn, function(err, result, errno, errmsg) {
      response.handleError(err, res, errno, errmsg, function(){
        response.handleSuccess(res, result, 200, 'Signed in successfully');
      });
    });
  },
  check: function(req, res) {
    let options = {mail:req.query.mail, user:req.query.user}
    if (options.mail) {
      isUniqueEmail(options, function(err, exists){
        response.handleError(err, res, 500, 'Error checking email', function(){
          response.handleSuccess(res, exists, 200, 'Checked email');
        });
      })
    }
    if (options.user) {
      isUniqueUser(options, function(err, exists){
        response.handleError(err, res, 500, 'Error checking user', function(){
          response.handleSuccess(res, exists, 200, 'Checked user');
        });
      })
    }
  },
  getUser: function(req, res) {
    var userId = req.decoded.user._id;
    getUserData(userId, function(err, doc) {
      response.handleError(err, res, 500, 'Error getting user data for user with id"' + userId + '"', function(){
        response.handleSuccess(res, doc, 200, 'Fetched user data');
      });
    })
  },
  subscribe: function(req, res) {
    var userId = req.decoded.user._id;
    var data = req.body;
    var updateObj = {};

    if (data) {
      if (data.lan) {
        updateObj['$set'] = {'jazyk.learnLan': data.lan}
      }
      if (data.courseId) {
        updateObj['$addToSet'] = {'jazyk.courses': data.courseId}
      }
    }

    // console.log(updateObj);

    User.findOneAndUpdate(
      {_id: userId}, updateObj, function(err, result) {
      response.handleError(err, res, 500, 'Error updating user', function(){
        response.handleSuccess(res, result, 200, 'Updated user');
      });
    });
  },
  refreshToken: function(req, res) {
    var payload = req.decoded;
    if (payload) {
      delete payload.iat;
      delete payload.exp;
      var token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET, {expiresIn: req.expiresIn});
      response.handleSuccess(res, token, 200, 'Refreshed token');
    }
  }
}
