const response = require('../response'),
      mongoose = require('mongoose'),
      jwt = require('jsonwebtoken'),
      md5 = require('md5'),
      User = require('../models/user').model,
      scrypt = require('scrypt');

const setEmailHash = (doc) => {
  if (doc) {
    doc.emailHash = md5(doc.email);
    doc.email = undefined;
  }
};

const addUser = function(body, callback) {
  const key = body.password;
  scrypt.kdf(key, {N: 1, r: 1, p: 1}, function(err, hash) {
    const userObject = new User({
          userName: body.userName,
          password: hash.toString('base64'),
          email: body.email.toLowerCase(),
          main: body.main,
          jazyk: body.jazyk
        });
    userObject.save(function(err2, result) {
      setEmailHash(result);
      callback(err2, result);
    });
  });
};

const findUser = function(body, expiresIn, callback) {
  const email = body.email ? body.email.trim().toLowerCase() : '',
        query = {email},
        projection = {
          _id: 1,
          userName: 1,
          email: 1,
          password: 1,
          main: 1,
          'jazyk.read': 1
        };
  User.findOne(query, projection, function (err, doc) {
    if (err) {
      callback(err, doc, 401, 'Error finding e-mail');
    }
    if (!doc) {
      callback({error: 'Usernamenotfound'}, doc, 401, 'This e-mail address could not be found');
    } else {
      scrypt.verifyKdf(new Buffer(doc.password, 'base64'), body.password, (err2, result) => {
        if (result !== true) {
          callback({error: 'Incorrectpw'}, doc, 401, 'Sign in failed');
        } else {
          doc.password = undefined;
          setEmailHash(doc);
          const token = jwt.sign({user: doc}, process.env.JWT_TOKEN_SECRET, {expiresIn: expiresIn});
          callback(null, {message: 'Success', token: token, user: doc});
        }
      });
    }
  });
};

const checkPassword = function(enteredPassword, userId, callback) {
  const query = {_id: userId},
        projection = {_id: 0, password: 1};
  User.findOne(query, projection, function(err, doc) {
    if (err) {
      callback(err, {msg: 'user not found'});
    } else {
      scrypt.verifyKdf(new Buffer(doc.password, 'base64'), enteredPassword, function(err2, result) {
        if (result !== true) {
          callback(true, {msg: 'Incorrect password'});
        } else {
          callback(null, {message: 'Password correct'});
        }
      });
    }
  });
};

const saveNewPassword = function(newPassword, userId, callback) {
  const key = newPassword;
  let password;
  scrypt.kdf(key, {N: 1, r: 1, p: 1}, function(err, hash) {
    password = hash.toString('base64');
    if (password) {
      const updateObj = {$set: {'password': password}};
      User.findOneAndUpdate(
        {_id: userId}, updateObj, function(err2, result) {
          callback(err2);
      });
    } else {
      callback({msg: 'no password'});
    }
  });
};

const isUniqueEmail = function(options, callback) {
  User.findOne({email: options.mail.toLowerCase()}, function(err, doc) {
    callback(err, doc !== null);
  });
};

const isUniqueUser = function(options, callback) {
  User.findOne({userName: {$regex: '^' + options.user, $options: 'i'}}, function(err, doc) {
    callback(err, doc !== null);
  });
};

const getUserData = function(userId, callback) {
  const query = {_id: userId},
        projection = {
          _id: 1,
          email: 1,
          userName: 1,
          main: 1,
          'jazyk.read': 1,
          isAdmin: 1
        };
  User.findOne(query, projection, function(err, doc) {
    setEmailHash(doc);
    callback(err, doc);
  });
};

const updateLastLoginDate = function(CurUser, res) {
  const update = {'jazyk.dt.lastLogin': Date.now()};
  User.findOneAndUpdate(CurUser._id, update, (err, result) => {
    if (err) {
      console.log('Error updating user login date');
    }
  });
};

const getPublicProfile = function(query, res) {
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
      setEmailHash(publicProfile);
      response.handleSuccess(res, publicProfile);
    });
  });
};

module.exports = {
  signup: function(req, res) {
    addUser(req.body, function(err, doc) {
      response.handleError(err, res, 400, 'Error creating new user', () => {
        if (doc) {
          doc.password = undefined;
        }
        response.handleSuccess(res, doc);
      });
    });
  },
  signin: function(req, res) {
    findUser(req.body, req.expiresIn, function(err, result, errno, errmsg) {
      response.handleError(err, res, errno, errmsg, () => {
        response.handleSuccess(res, result);
        updateLastLoginDate(result, res);
      });
    });
  },
  check: function(req, res) {
    const options = {mail: req.query.mail, user: req.query.user};
    if (options.mail) {
      isUniqueEmail(options, function(err, exists) {
        response.handleError(err, res, 400, 'Error checking email', () => {
          response.handleSuccess(res, exists);
        });
      });
    }
    if (options.user) {
      isUniqueUser(options, function(err, exists) {
        response.handleError(err, res, 400, 'Error checking user', () => {
          response.handleSuccess(res, exists);
        });
      });
    }
  },
  getUser: function(req, res) {
    const userId = req.decoded.user._id;
    getUserData(userId, function(err, doc) {
      response.handleError(err, res, 400, 'Error getting user data for user with id"' + userId + '"', () => {
        response.handleSuccess(res, doc);
      });
    });
  },
  saveSettings: function(req, res) {
    const userId = req.decoded.user._id,
          mainSettings = req.body.main,
          readSettings = req.body.read,
          query = {_id: userId},
          updateObj = {$set: {
            'main': mainSettings,
            'jazyk.read': readSettings}
          };
    User.findOneAndUpdate(query, updateObj, function(err, result) {
      response.handleError(err, res, 400, 'Error updating settings', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  getProfile: function(req, res) {
    const userId = req.decoded.user._id,
          query = {_id: userId},
          projection = {_id: 0, 'jazyk.profile': 1};
    User.findOne(query, projection, function(err, result) {
      response.handleError(err, res, 400, 'Error fetching profile', () => {
        response.handleSuccess(res, result.jazyk.profile);
      });
    });
  },
  getCompactProfiles: function(req, res) {
    const userIds = req.params.userIds.split(','),
          query = {_id: {$in: userIds}},
          projection = {userName: 1, email: 1};
    User.find(query, projection, function(err, users) {
      response.handleError(err, res, 400, 'Error fetching users', () => {
        users.forEach(emailUser => setEmailHash(emailUser));
        response.handleSuccess(res, users);
      });
    });
  },
  saveProfile: function(req, res) {
    const userId = req.decoded.user._id,
          profile = req.body,
          query = {_id: userId},
          updateObj = {$set: {'jazyk.profile': profile}};
    User.findOneAndUpdate(query, updateObj, function(err, result) {
      response.handleError(err, res, 400, 'Error updating profile', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  getPublicProfile: function(req, res) {
    const userName = req.params.userName,
          query = {userName};
    getPublicProfile(query, res);
  },
  getPublicProfileById: function(req, res) {
    if (mongoose.Types.ObjectId.isValid(req.params.userId)) {
      const query = {_id: req.params.userId};
      getPublicProfile(query, res);
    } else {
      const err = 'Invalid user id';
      response.handleError(err, res, 400, err);
    }
  },
  updateReadLan: function(req, res) {
    const userId = req.decoded.user._id,
          data = req.body,
          update = {'$set': {'jazyk.read.lan': data.lanCode}};
    User.findByIdAndUpdate(userId, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating read lan', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  updateUserLan: function(req, res) {
    const userId = req.decoded.user._id,
          lanCode = req.body.lanCode,
          update = {'$set': {'main.myLan': lanCode}};
    User.findByIdAndUpdate(userId, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating user lan', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  updatePassword: function(req, res) {
    const userId = req.decoded.user._id,
          data = req.body;
    checkPassword(data.old, userId, function(err, doc) {
      response.handleError(err, res, 400, 'IncorrectPassword', () => {
        saveNewPassword(data.new, userId, function(err2) {
          response.handleError(err2, res, 400, 'Error saving password', () => {
            response.handleSuccess(res, true);
          });
        });
      });
    });
  },
  refreshToken: function(req, res) {
    const payload = req.decoded;
    if (payload) {
      delete payload.iat;
      delete payload.exp;
      const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET, {expiresIn: req.expiresIn});
      response.handleSuccess(res, {token});
    }
  },
  getMailData: function(req, res, recipients) {
    if (recipients.length > 0) {
      recipients = recipients.slice(0, 1000); // max 1000 ids
      const recipientIds = recipients.map(recipient => recipient.recipient),
            query = {'_id': {$in: recipientIds}},
            projection = {userName: 1, email: 1},
            options = {sort: {userName: 1}};
      User.find(query, projection, options, function(err, docs) {
        response.handleError(err, res, 400, 'Error getting mail data for recipients', () => {
          docs.forEach(doc => setEmailHash(doc));
          response.handleSuccess(res, docs);
        });
      });
    } else {
      response.handleSuccess(res, null);
    }
  }
};
