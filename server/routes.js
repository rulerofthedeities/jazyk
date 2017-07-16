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
  router.put('/course/header', courses.updateCourseHeader);
  router.patch('/course/property/:id', courses.updateCourseProperty);

  router.post('/chapter/:id', courses.addChapter);
  router.put('/chapter/:id', courses.removeChapter);
  router.get('/chapters/:id', courses.getChapters);
  router.put('/chapters/:id', courses.updateChapters);

  router.get('/lessons/:id', lessons.getLessons);
  router.get('/lesson/:id', lessons.getLesson);
  router.get('/lesson/first/:id', lessons.getFirstLesson);
  router.post('/lesson', lessons.addLesson);
  router.delete('/lesson/:id', lessons.removeLesson);
  router.put('/lesson/header', lessons.updateLessonHeader);
  router.put('/lessonIds/:id', courses.updateLessonIds);

  router.get('/wordpairs', words.getWordPairs);
  router.get('/wordpair/:id', words.getWordPairDetail);
  router.get('/wordpair/media/:id', words.getWordDetailMedia);

  router.get('/exercises/:id', exercises.getExercises);
  router.post('/exercise/:id', exercises.addExercise);
  router.put('/exercise/:id', exercises.updateExercise);
  router.put('/exercises/:id', exercises.updateExercises);
  router.delete('/exercise/:lessonId/:exerciseId', exercises.removeExercise);

  app.use('/api/', router);

  app.use(function (req, res) {
    var home = path.resolve(__dirname + '/../dist/index.html');
    res.sendFile(home);
  });
};
