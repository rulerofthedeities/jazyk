var path = require("path");

module.exports.initialize = function(app, router) {

  //router.get('/sync/connections', sync_connections.load);

  app.use('/api/', router);

  app.use(function (req, res) {
    var home = path.resolve(__dirname + '/../dist/index.html');
    res.sendFile(home);
  });
};
