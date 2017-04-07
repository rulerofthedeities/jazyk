var path = require("path"),
    courses = require("./controllers/courses");

module.exports.initialize = function(app, router) {

  router.get('/courses/:lan', courses.getCourses);
  router.get('/course/:id', courses.getCourse);

  router.post('/course', courses.addCourse);
  router.put('/course', courses.updateCourse);

  app.use('/api/', router);

  app.use(function (req, res) {
    var home = path.resolve(__dirname + '/../dist/index.html');
    res.sendFile(home);
  });
};
