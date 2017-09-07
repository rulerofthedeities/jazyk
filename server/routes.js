var path = require("path"),
    jwt = require('jsonwebtoken'),
    users = require("./controllers/users"),
    courses = require("./controllers/courses"),
    lessons = require("./controllers/lessons"),
    errors = require("./controllers/errors"),
    words = require("./controllers/words"),
    config = require("./controllers/config"),
    translations = require("./controllers/translations"),
    exercises = require("./controllers/exercises"),
    results = require("./controllers/results"),
    response = require("./response");

module.exports.initialize = function(app, router) {
  router.use(['/user/refresh', '/user/signin'], (req, res, next) => {
    req.expiresIn = app.get('token_expiration') || 86400;
    next();
  });

  router.post('/error', errors.addError);

  router.get('/user/check', users.check);
  router.post('/user/signin', users.signin);
  router.post('/user/signup', users.signup);

  router.get('/config/lan/:lan', config.getLanConfig);

  router.get('/translations/:lan/:component', translations.getTranslations);

  router.get('/courses/:lan', courses.getLanCourses);
  router.get('/course/:id', courses.getCourse);
  router.post('/course', courses.addCourse);
  router.put('/course/header', courses.updateCourseHeader);
  router.patch('/course/property/:id', courses.updateCourseProperty);
  router.patch('/course/lesson/:id', courses.updateCourseLesson);

  router.post('/chapter/:id', courses.addChapter);
  router.put('/chapter/:id', courses.removeChapter);
  router.get('/chapters/:id', courses.getChapters);
  router.put('/chapters/:id', courses.updateChapters);

  router.get('/lessons/:id', lessons.getLessons);
  router.get('/lesson/:lessonId', lessons.getLesson);
  router.get('/lessons/header/:courseId', lessons.getLessonHeaders);
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
  router.get('/exercises/course/:courseId', exercises.getExercises);
  router.put('/exercises/:id', exercises.updateExercises);
  router.delete('/exercise/:lessonId/:exerciseId', exercises.removeExercise);

  router.get('/choices/lesson/:lessonId', exercises.getLessonChoices);
  router.get('/choices/course/:courseId', exercises.getCourseChoices);


  router.use('/', function(req, res, next) {
    jwt.verify(req.token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
      response.handleError(err, res, 401, 'Authentication failed', function(){
        req.decoded = decoded;
        next();
      });
    });
  });

  /*** authenticated ***/

  router.put('/user/settings', users.saveLearnSettings);
  router.patch('/user/lan', users.updateLan);
  router.patch('/user/refresh', users.refreshToken);
  router.post('/user/subscribe', users.subscribe);
  router.get('/user', users.getUser);
  
  router.get('/user/results/lesson/lastperexercise/:lessonId', results.getLastResults);
  router.get('/user/results/lesson/countbystep/:lessonId', results.getResultsDone);
  router.get('/user/results/lesson/overview/:lessonId', results.getLessonOverviewResults);
  router.get('/user/results/lesson/:step/:lessonId', results.getLessonResults);

  router.get('/user/results/course/currentlesson/:courseId', results.getCurrentLesson);
  router.get('/user/results/course/toreview/:courseId', results.getToReview);
  router.post('/user/results/add', results.saveResults);
  
  router.get('/user/courses', courses.getUserCourses);


  router.get('/user', users.getUser);
  
  app.use('/api/', router);

  app.use(function (req, res) {
    var home = path.resolve(__dirname + '/../dist/index.html');
    res.sendFile(home);
  });
};
