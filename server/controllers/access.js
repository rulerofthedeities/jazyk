module.exports = {
  checkAccess: function(userId, minLevel) {
    return {
      $elemMatch:{
        userId,
        level: {$gte: minLevel}
      }
    };
  }
}