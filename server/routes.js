var path = require("path"),
    courses = require("./controllers/courses"),
    lessons = require("./controllers/lessons"),
    errors = require("./controllers/errors"),
    words = require("./controllers/words"),
    config = require("./controllers/config"),
    translations = require("./controllers/translations"),
    exercises = require("./controllers/exercises");

module.exports.initialize = function(app, router) {
  router.post('/error', errors.addError);

  router.get('/config/lan/:lan', config.getLanConfig);

  router.get('/translations/:lan/:component', translations.getTranslations);

  router.get('/courses/:lan', courses.getAllCourses);
  router.get('/course/:id', courses.getCourse);
  router.post('/course', courses.addCourse);
  router.put('/course', courses.updateCourse);
  router.patch('/course/public/:id/:status', courses.setPublic);
  router.patch('/course/publish/:id/:status', courses.setPublish);

  router.post('/chapter', lessons.addChapter);

  router.get('/lessons/:id', lessons.getLessons);
  router.get('/lesson/:id', lessons.getLesson);
  router.get('/lesson/first/:id', lessons.getFirstLesson);
  router.post('/lesson', lessons.addLesson);
  router.put('/lesson', lessons.updateLesson);

  router.get('/wordpairs', words.getWordPairs);
  router.get('/wordpair/:id', words.getWordPairDetail);
  router.get('/wordpair/media/:id', words.getWordDetailMedia);

  router.get('/exercises/:id', exercises.getExercises);
  router.post('/exercise/:id', exercises.addExercise);
  router.put('/exercise/:id', exercises.updateExercise);
  router.delete('/exercise/:lessonId/:exerciseId', exercises.removeExercise);

  app.use('/api/', router);

  app.use(function (req, res) {
    var home = path.resolve(__dirname + '/../dist/index.html');
    res.sendFile(home);
  });
};
