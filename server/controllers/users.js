const response = require('../response'),
      mongoose = require('mongoose'),
      jwt = require('jsonwebtoken'),
      scrypt = require('scrypt'),
      md5 = require('md5'),
      User = require('../models/user'),
      UserCourse = require('../models/usercourse'),
      Follow = require('../models/follow'),
      Notification = require('../models/notification');

var setEmailHash = (doc) => {
  doc.emailHash = md5(doc.email);
  doc.email = undefined;
};

var addUser = function(body, callback) {
  const key = body.password;
  scrypt.kdf(key, {N: 1, r:1, p:1}, function(err, hash) {
    const user = new User({
          userName: body.userName,
          password: hash.toString('base64'),
          email: body.email.toLowerCase(),
          'main': body.main,
          jazyk: body.jazyk,
          vocabulator: {learnLan: body.vocabulator.learnLan},
          grammator: {learnLan: body.grammator.learnLan}
        });
    user.save(function(err, result) {
      setEmailHash(result);
      callback(err, result);
    });
  });
};

var findUser = function(body, expiresIn, callback) {
  User.findOne({email: body.email}, {_id: 1, userName: 1, email: 1, password: 1, main: 1, 'jazyk.learn': 1}, function (err, doc) {
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
          setEmailHash(doc);
          var token = jwt.sign({user: doc}, process.env.JWT_TOKEN_SECRET, {expiresIn: expiresIn});
          callback(null, {message: 'Success', token: token, user: doc});
        }
      });
    }
  })
};

var checkPassword = function(enteredPassword, userId, callback) {
  User.findOne({_id: userId}, {_id: 0, password: 1}, function(err, doc) {
    if (err) {
      callback(err, {msg: 'user not found'});
    } else {
      scrypt.verifyKdf(new Buffer(doc.password, 'base64'), enteredPassword, function(err, result) {
        if (result !== true) {
          callback(true, {msg: 'Incorrect password'});
        } else {
          callback(null, {message: 'Password correct'});
        }
      });
    }
  });
}

var saveNewPassword = function(newPassword, userId, callback) {
  const key = newPassword;
  let password;
  scrypt.kdf(key, {N: 1, r:1, p:1}, function(err, hash) {
    password = hash.toString('base64');
    if (password) {
      const updateObj = {$set: {'password': password}};
      User.findOneAndUpdate(
        {_id: userId}, updateObj, function(err, result) {
          callback(err);
      });
    } else {
      callback({msg: 'no password'});
    }
  });
}

var isUniqueEmail = function(options, callback) {
  User.findOne({email: options.mail.toLowerCase()}, function(err, doc) {
    callback(err, doc !== null);
  });
}

var isUniqueUser = function(options, callback) {
  User.findOne({userName: {$regex: '^' + options.user, $options:'i'}}, function(err, doc) {
    callback(err, doc !== null);
  });
}

var getUserData = function(userId, callback) {
  User.findOne({_id: userId}, {_id: 1, email: 1, userName: 1, main: 1, 'jazyk.learn': 1}, function(err, doc) {
    setEmailHash(doc);
    callback(err, doc);
  });
}

module.exports = {
  signup: function(req, res) {
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
    const options = {mail:req.query.mail, user:req.query.user}
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
    const userId = req.decoded.user._id;
    getUserData(userId, function(err, doc) {
      response.handleError(err, res, 500, 'Error getting user data for user with id"' + userId + '"', function(){
        response.handleSuccess(res, doc, 200, 'Fetched user data');
      });
    })
  },
  getLearnSettings: function(req, res) {
    const userId = req.decoded.user._id;
    User.findOne(
      {_id: userId}, {_id: 0, 'jazyk.learn':1}, function(err, result) {
      response.handleError(err, res, 500, 'Error fetching learn settings', function(){
        response.handleSuccess(res, result.jazyk.learn, 200, 'Fetched learn settings');
      });
    });
  },
  saveLearnSettings: function(req, res) {
    const userId = req.decoded.user._id,
          settings = req.body,
          updateObj = {$set: {'jazyk.learn': settings}};
    User.findOneAndUpdate(
      {_id: userId}, updateObj, function(err, result) {
      response.handleError(err, res, 500, 'Error updating learn settings', function(){
        response.handleSuccess(res, true, 200, 'Updated learn settings');
      });
    });
  },
  saveMainSettings: function(req, res) {
    const userId = req.decoded.user._id,
          settings = req.body,
          updateObj = {$set: {'main': settings}};
    console.log('saving main settings', updateObj);
    User.findOneAndUpdate(
      {_id: userId}, updateObj, function(err, result) {
      response.handleError(err, res, 500, 'Error updating main settings', function(){
        response.handleSuccess(res, true, 200, 'Updated main settings');
      });
    });
  },
  getProfile: function(req, res) {
    const userId = req.decoded.user._id;
    User.findOne(
      {_id: userId}, {_id: 0, 'jazyk.profile':1}, function(err, result) {
      response.handleError(err, res, 500, 'Error fetching profile', function(){
        response.handleSuccess(res, result.jazyk.profile, 200, 'Fetched profile');
      });
    });
  },
  saveProfile: function(req, res) {
    const userId = req.decoded.user._id,
          profile = req.body,
          updateObj = {$set: {'jazyk.profile': profile}};
    User.findOneAndUpdate(
      {_id: userId}, updateObj, function(err, result) {
      response.handleError(err, res, 500, 'Error updating profile', function(){
        response.handleSuccess(res, true, 200, 'Updated profile');
      });
    });
  },
  getPublicProfile: function(req, res) {
    const userName = req.params.userName,
          query = {userName},
          projection = {'jazyk.profile': 1, 'jazyk.courses': 1, userName: 1, dtJoined: 1};
    User.findOne(query, projection, (err, result) => {
        let errCode = 500;
        if (!result) {
          err = {msg: '404 not found'};
          errCode = 404;
        }
        response.handleError(err, res, errCode, 'Error fetching public profile', () => {
        const publicProfile = JSON.parse(JSON.stringify(result.jazyk));
        publicProfile.userName = result.userName;
        publicProfile.dtJoined = result.dtJoined;
        publicProfile._id = result._id
        response.handleSuccess(res, publicProfile, 200, 'Fetched public profile');
      });
    });
  },
  saveNotification: function(req, res) {
    const userId = req.decoded.user._id,
          notification = new Notification(req.body);
    notification.save(function(err, result) {
      response.handleError(err, res, 500, 'Error saving notification', function(){
        response.handleSuccess(res, result, 200, 'Saved profile');
      });
    });
  },
  getNotifications: function(req, res) {
    const userId = req.decoded.user._id,
          query = {userId},
          projection = {title: 1, read: 1, dt: 1},
          sort = {dt: -1};
    Notification.find(query, projection, {sort}, function(err, notifications) {
      response.handleError(err, res, 500, 'Error fetching notifications', function(){
        response.handleSuccess(res, notifications, 200, 'Fetched notifications');
      });
    });
  },
  getNotification: function(req, res) {
    const notificationId = new mongoose.Types.ObjectId(req.params.notificationId),
          query = {_id: notificationId};
    Notification.findOne(query, function(err, notification) {
      response.handleError(err, res, 500, 'Error fetching notification', function(){
        response.handleSuccess(res, notification, 200, 'Fetched notification');
      });
    });
  },
  setNotificationRead: function(req, res) {
    const notificationId = new mongoose.Types.ObjectId(req.body.notificationId),
          query = {_id: notificationId},
          update = {read: true};
    Notification.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 500, 'Error setting notification as read', function(){
        response.handleSuccess(res, true, 200, 'Read notification');
      });
    });
  },
  getNotificationsCount: function(req, res) {
    const userId = req.decoded.user._id,
          query = {userId, read: false};
    Notification.count(query, function(err, count) {
      response.handleError(err, res, 500, 'Error fetching notifications count', function(){
        response.handleSuccess(res, count, 200, 'Fetched notifications count');
      });
    });
  },
  followUser: function(req, res) {
    const userId = req.decoded.user._id,
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
    const userId = req.decoded.user._id,
          userIdToUnFollow = new mongoose.Types.ObjectId(req.body.userId),
          query = {userId, followId: userIdToUnFollow},
          update = {follow: false};
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
  updateLan: function(req, res) {
    const userId = req.decoded.user._id,
          data = req.body,
          lanObj = {};
    if (data && data.lan) {
      lanObj['$set'] = {'jazyk.learn.lan': data.lan}
    }
    User.findOneAndUpdate(
      {_id: userId}, lanObj, function(err, result) {
      response.handleError(err, res, 500, 'Error updating user', function(){
        response.handleSuccess(res, result, 200, 'Updated user');
      });
    });
  },
  subscribe: function(req, res) {
    const userId = req.decoded.user._id,
          data = req.body;

    if (data && data.courseId) {
      const query = {userId, courseId: data.courseId},
            update = {$set: {subscribed: true}, $setOnInsert: {userId, courseId: data.courseId}};
      UserCourse.findOneAndUpdate(query, update, {upsert: true}, function(err, result) {
        response.handleError(err, res, 500, 'Error updating user', function(){
          response.handleSuccess(res, result, 200, 'Updated user');
        });
      });
    } else {
      response.handleSuccess(res, {}, 200, 'No course data to update');
    }
  },
  updatePassword: function(req, res) {
    const userId = req.decoded.user._id,
          data = req.body;
    checkPassword(data.old, userId, function(err, doc) {
      response.handleError(err, res, 500, 'IncorrectPassword', function() {
        saveNewPassword(data.new, userId, function(err) {
          response.handleError(err, res, 500, 'Error saving password', function() {
            response.handleSuccess(res, true, 200, 'Updated password');
          });
        })
      });
    })
  },
  refreshToken: function(req, res) {
    const payload = req.decoded;
    if (payload) {
      delete payload.iat;
      delete payload.exp;
      const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET, {expiresIn: req.expiresIn});
      response.handleSuccess(res, token, 200, 'Refreshed token');
    }
  }
}
