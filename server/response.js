'use strict';

module.exports = {
  handleError: function(err, res, statusno, title, callback) {
    if (err) {
      return res.status(statusno).json({
        title: title,
        error: err
      });
    } else {
      callback();
    }
  },
  handleSuccess: function(res, result, statusno, message, objname) {
    objname = objname || 'obj';
    var returnObj = {message:message};
    returnObj[objname] = result;
    
    res.status(statusno).send(returnObj);
  }
}
