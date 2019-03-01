'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      jwt = require('jsonwebtoken'),
      md5 = require('md5'),
      User = require('../models/user').model,
      UserTrophy = require('../models/userbook').userTrophy,
      scrypt = require('scrypt'),
      sgMail = require('@sendgrid/mail');

const setEmailHash = (doc) => {
  if (doc) {
    doc.emailHash = md5(doc.email);
    doc.email = undefined;
  }
};

const isElapsed = (dt, maxElapseHours) => {
  const expiryTime = new Date(dt).getTime(),
        currentTime = Date.now(),
        elapseMs = currentTime - expiryTime,
        elapseHours = elapseMs / 1000 / 60 / 60;
  return !!(elapseHours > maxElapseHours);
}

const addUser = (body, callback) => {
  const key = body.password;
  scrypt.kdf(key, {N: 1, r: 1, p: 1}, (err, hash) => {
    const userObject = new User({
          userName: body.userName,
          password: hash.toString('base64'),
          email: body.email.toLowerCase(),
          main: body.main,
          jazyk: body.jazyk
        });
    userObject.save((err2, result) => {
      setEmailHash(result);
      callback(err2, result);
    });
  });
};

const findUser = (body, expiresIn, callback) => {
  const email = body.email ? body.email.trim().toLowerCase() : '',
        query = {email},
        projection = {
          _id: 1,
          userName: 1,
          email: 1,
          password: 1,
          main: 1,
          'mailVerification.isVerified': 1,
          mailOptIn: 1,
          'jazyk.read': 1
        };
  User.findOne(query, projection, (err, doc) => {
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

const checkPassword = (enteredPassword, userId, callback) => {
  const query = {_id: userId},
        projection = {_id: 0, password: 1};
  User.findOne(query, projection, (err, doc) => {
    if (err) {
      callback(err, {msg: 'user not found'});
    } else {
      scrypt.verifyKdf(new Buffer(doc.password, 'base64'), enteredPassword, (err2, result) => {
        if (result !== true) {
          callback(true, {msg: 'Incorrect password'});
        } else {
          callback(null, {message: 'Password correct'});
        }
      });
    }
  });
};

const saveNewPassword = (newPassword, userId, callback) => {
  const key = newPassword;
  let password;
  scrypt.kdf(key, {N: 1, r: 1, p: 1}, (err, hash) => {
    password = hash.toString('base64');
    if (password) {
      const updateObj = {$set: {'password': password}};
      User.findOneAndUpdate(
        {_id: userId}, updateObj, (err2, result) => {
          callback(err2);
      });
    } else {
      callback({msg: 'no password'});
    }
  });
};

const isUniqueEmail = (options, callback) => {
  User.findOne({email: options.mail.toLowerCase()}, (err, doc) => {
    callback(err, doc !== null);
  });
};

const isUniqueUser = (options, callback) => {
  User.findOne({userName: {$regex: '^' + options.user, $options: 'i'}}, (err, doc) => {
    callback(err, doc !== null);
  });
};

const getUserData = (userId, callback) => {
  const query = {_id: userId},
        projection = {
          _id: 1,
          email: 1,
          userName: 1,
          main: 1,
          'jazyk.read': 1,
          isAdmin: 1,
          'mailVerification.isVerified': 1,
          mailOptIn: 1
        };
  User.findOne(query, projection, (err, doc) => {
    setEmailHash(doc);
    callback(err, doc);
  });
};

const getUserMailVerificationData = (userId, callback) => {
  const query = {_id: userId},
        projection = {
          _id: 0,
          mailVerification: 1,
          email: 1
        };
  User.findOne(query, projection, (err, doc) => {
    callback(err, doc);
  });
};

const updateLastLoginDate = (CurUser, res) => {
  const userId = new mongoose.Types.ObjectId(CurUser.user._id),
        update = {$set: {'jazyk.dt.lastLogin': Date.now()}};
  User.findOneAndUpdate({_id: userId}, update, (err, result) => {
    if (err) {
      console.log('Error updating user login date');
    }
  });
};

module.exports = {
  signup: (req, res) => {
    addUser(req.body, (err, doc) => {
      response.handleError(err, res, 400, 'Error creating new user', () => {
        if (doc) {
          doc.password = undefined;
        }
        response.handleSuccess(res, doc);
      });
    });
  },
  signin: (req, res) => {
    findUser(req.body, req.expiresIn, (err, result, errno, errmsg) => {
      response.handleError(err, res, errno, errmsg, () => {
        response.handleSuccess(res, result);
        updateLastLoginDate(result, res);
      });
    });
  },
  check: (req, res) => {
    const options = {
      mail: req.query.mail,
      user: req.query.user
    };
    if (options.mail) {
      isUniqueEmail(options, (err, exists) => {
        response.handleError(err, res, 400, 'Error checking email', () => {
          response.handleSuccess(res, exists);
        });
      });
    }
    if (options.user) {
      isUniqueUser(options, (err, exists) => {
        response.handleError(err, res, 400, 'Error checking user', () => {
          response.handleSuccess(res, exists);
        });
      });
    }
  },
  getUser: (req, res) => {
    const userId = req.decoded.user._id;
    getUserData(userId, (err, doc) => {
      response.handleError(err, res, 400, 'Error getting user data for user with id"' + userId + '"', () => {
        response.handleSuccess(res, doc);
      });
    });
  },
  getUsersById: (req, res) => {
    const userIds = req.body.userIds,
        query = {_id: {$in: userIds}},
        projection = {
          _id: 1,
          userName: 1,
          emailHash: 1,
          email: 1
        };
    User.find(query, projection, (err, users) => {
      response.handleError(err, res, 400, 'Error fetching users', () => {
        users.forEach(emailUser => setEmailHash(emailUser));
        response.handleSuccess(res, users);
      });
    });
  },
  saveSettings: (req, res) => {
    const userId = req.decoded.user._id,
          mainSettings = req.body.main,
          readSettings = req.body.read,
          query = {_id: userId},
          update = {$set: {
            'main': mainSettings,
            'jazyk.read': readSettings}
          };
    User.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating main settings', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  saveMailSettings: (req, res) => {
    const userId = req.decoded.user._id,
          mailSettings = req.body,
          query = {_id: userId},
          update = {$set: {
            'mailOptIn': mailSettings}
          };
    User.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating mail settings', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  updateReadLan: (req, res) => {
    const userId = req.decoded.user._id,
          data = req.body,
          update = {'$set': {'jazyk.read.lan': data.lanCode}};
    User.findByIdAndUpdate(userId, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating read lan', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  updateUserLan: (req, res) => {
    const userId = req.decoded.user._id,
          lanCode = req.body.lanCode,
          update = {'$set': {'main.myLan': lanCode}};
    User.findByIdAndUpdate(userId, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating user lan', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  updatePassword: (req, res) => {
    const userId = req.decoded.user._id,
          data = req.body;
    checkPassword(data.old, userId, (err, doc) => {
      response.handleError(err, res, 400, 'IncorrectPassword', () => {
        saveNewPassword(data.new, userId, (err2) => {
          response.handleError(err2, res, 400, 'Error saving password', () => {
            response.handleSuccess(res, true);
          });
        });
      });
    });
  },
  getMailData: (req, res, recipients) => {
    if (recipients.length > 0) {
      recipients = recipients.slice(0, 1000); // max 1000 ids
      const recipientIds = recipients.map(recipient => recipient.recipient),
            query = {'_id': {$in: recipientIds}},
            projection = {userName: 1, email: 1},
            options = {sort: {userName: 1}};
      User.find(query, projection, options, (err, docs) => {
        response.handleError(err, res, 400, 'Error getting mail data for recipients', () => {
          docs.forEach(doc => setEmailHash(doc));
          response.handleSuccess(res, docs);
        });
      });
    } else {
      response.handleSuccess(res, null);
    }
  },
  sendMailVerification: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          mailData = req.body.mailData,
          setVerificationDoc = (verificationDoc) => {
            if (!verificationDoc || !verificationDoc.verificationId) {
              // New verificationDoc
              verificationDoc = {
                verificationId: new mongoose.Types.ObjectId(),
                timesSent: 1,
                dtLastSent: Date.now()
              };
            } else {
              // Existing verificationDOc
              verificationDoc.timesSent++;
              verificationDocdtLastSent= Date.now();
            }
            return verificationDoc;
          },
          saveVerificationDoc = (userId, verificationDoc) => {
            const update = {'mailVerification': verificationDoc};
            User.findOneAndUpdate({_id: userId}, update, (err, result) => {
              if (err) {
                console.log(`Error updating mail verification date for user with id"${userId}"`, err);
              }
            });
          },
          buildMessage = (mailData, url) => {
            const text = mailData.bodyText.replace('%s', url),
                  html = mailData.bodyHtml.replace('%s', url);
            return {
              to: mailData.recipientEmail,
              from: {
                name: 'Jazyk',
                email: 'no-reply@k-modo.com',
              },
              subject: mailData.subject,
              text,
              html
            };
          },
          sendMail = (verificationDoc, email) => {
            const host = process.env.BACKEND_URL,
                  url = host + '/v/verifymail?verId=' + verificationDoc.verificationId.toString();
            mailData.recipientEmail = email;
            if (mailData && mailData.subject) {
              const msg = buildMessage(mailData, url);
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              sgMail
              .send(msg, (error, result) => {
                response.handleError(error, res, 400, 'Error sending verification mail', () => {
                  response.handleSuccess(res, true);
                });
              });
            } else {
              response.handleSuccess(res, false);
            }
          };

    getUserMailVerificationData(userId, (err, userVerificatonDoc) => {
      response.handleError(err, res, 400, `Error getting user mail verification data for user with id"${userId}"`, () => {
        const verificationDoc = setVerificationDoc(userVerificatonDoc.mailVerification);
        saveVerificationDoc(userId, verificationDoc);
        if (verificationDoc.verificationId) {
          sendMail(verificationDoc, userVerificatonDoc.email);
        }
      });
    });
  },
  checkverificationId: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          verifyId = req.body.verId;

    const addMailTrophy = () => {
            const trophy = new UserTrophy({userId, trophy: '901'});
            trophy.save((err, result) => {});
          },
          setUserAsVerified = (isVerified) => {
            const update = {$set: {'mailVerification.isVerified': true}};
            User.findOneAndUpdate({_id: userId}, update, {isNew: true}, (err, result) => {
              response.handleError(err, res, 400, `Error setting mail as verified for user with id"${userId}"`, () => {
                if (!!result && !isVerified) {
                  // wasn't verified yet, add mail trophy
                  addMailTrophy();
                }
                response.handleSuccess(res, true);
              });
            });
          };
    getUserMailVerificationData(userId, (err, userVerificatonDoc) => {
      response.handleError(err, res, 400, `Error getting user mail verification data for user with id"${userId}"`, () => {
        const verificationDoc = userVerificatonDoc.mailVerification;
        if (mongoose.Types.ObjectId.isValid(verifyId) && verificationDoc.verificationId.toString() === verifyId) {
          setUserAsVerified(verificationDoc.isVerified);
        } else {
          response.handleSuccess(res, false);
        }
      });
    });
  },
  checkresetId: (req, res) => {
    const resetId = req.body.resetId,
          email = req.body.email ? decodeURI(req.body.email).toLowerCase() : null,
          query = {email},
          projection = {
            _id: 0,
            mailPwReset: 1,
            email: 1
          };
    if (mongoose.Types.ObjectId.isValid(resetId)) {
      User.findOne(query, projection, (err, doc) => {
        response.handleError(err, res, 400, `Error finding email "${email}"`, () => {
          if (doc && doc.mailPwReset) {
            const resetDoc = doc.mailPwReset;
            if (resetDoc.resetId && resetDoc.resetId.toString() === resetId) {
              if (isElapsed(resetDoc.dt, 6)) {
                response.handleSuccess(res, '3');
              } else {
                response.handleSuccess(res, '0');
              }
            } else {
              response.handleSuccess(res, '2');
            }
          } else {
            response.handleSuccess(res, '1');
          }
        });
      });
    } else {
      response.handleSuccess(res, '2');
    }
  },
  sendForgotPassword: (req, res) => {
    const mailData = req.body.mailData,
          email = req.body.email,
          setForgottenPwDoc = (email, cb) => {
            if (email) {
              const forgottenPwDoc = {
                      dt: Date.now(),
                      resetId: new mongoose.Types.ObjectId(),
                      email
                    },
                    update = {$set: {mailPwReset : forgottenPwDoc}};
              User.findOneAndUpdate({email: email.toLowerCase()}, update, {}, (err, result) => {
                cb(err, forgottenPwDoc);
              });
            }
          },
          buildMessage = (mailData, url) => {
            const text = mailData.bodyHtml.replace('%link', mailData.linkText + ': ' + url + ' '),
                  html = mailData.bodyText.replace('%link', `<a href="${url}">${mailData.linkText}</a>`);
            return {
              to: mailData.recipientEmail,
              from: {
                name: 'Jazyk',
                email: 'no-reply@k-modo.com',
              },
              subject: mailData.subject,
              text,
              html
            };
          },
          sendMail = (pwForgottenDoc, email) => {
            const host = process.env.BACKEND_URL,
                  url = host + '/v/resetpw?email=' + encodeURI(email) + '&resetId=' + pwForgottenDoc.resetId.toString();
            mailData.recipientEmail = email;
            if (mailData && mailData.subject) {
              const msg = buildMessage(mailData, url);
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              sgMail
              .send(msg, (error, result) => {
                response.handleError(error, res, 400, 'Error sending verification mail', () => {
                  response.handleSuccess(res, true);
                });
              });
            } else {
              response.handleSuccess(res, false);
            }
          };
    setForgottenPwDoc(email, (err, mailPwReset) => {
      response.handleError(err, res, 400, `Error: email address does not exist "${email}"`, () => {
        if (mailPwReset) {
          sendMail(mailPwReset, email);
        } else {
          response.handleSuccess(res, false);
        }
      });
    });
  },
  resetpw: (req, res) => {
    const resetId = req.body.resetId,
          email = req.body.email,
          newpassword = req.body.pw;
    // check if the resetId is a valid Id (mongoose)
    if (mongoose.Types.ObjectId.isValid(resetId)) {
        // do a query for both email and resetId
        User.findOne({email: email.toLowerCase(), 'mailPwReset.resetId': resetId}, (err, userDoc) => {
          response.handleError(err, res, 400, `Error: email/resetId combo does not exist "${email} ${resetId}"`, () => {
            if (userDoc && userDoc.mailPwReset) {
              // check if reset id isn't expired (a bit more than 6 hrs)
              if (!isElapsed(userDoc.mailPwReset.dt, 6.2)) {
                // set new password
                saveNewPassword(newpassword, userDoc._id, (err2) => {
                  response.handleError(err2, res, 400, 'Error saving password', () => {
                    // clear password doc
                    const update = {$set: {'mailPwReset': null}};
                    User.findOneAndUpdate({_id: userDoc._id}, update, (err, result) => {
                      response.handleError(err, res, 400, `Error clearing password reset for id"${userDoc._id}"`, () => {
                        response.handleSuccess(res, '0');
                      });
                    });
                  });
                });
              } else {
                response.handleSuccess(res, '3');
              }
            } else {
              response.handleSuccess(res, '2');
            }
        });
      });
    } else {
      response.handleSuccess(res, '1');
    }
  },
  refreshToken: (req, res) => {
    const payload = req.decoded;
    if (payload) {
      delete payload.iat;
      delete payload.exp;
      const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET, {expiresIn: req.expiresIn});
      response.handleSuccess(res, {token});
    }
  },
  commonSetEmailHash: (doc) => {
    setEmailHash(doc);
  }
};
