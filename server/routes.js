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

  router.get('/courses/public/:lan', courses.getPublicLanCourses);
  router.get('/courses/:lan', courses.getLanCourses);
  router.get('/learn/course/:courseId', courses.getCourse);

  router.get('/chapters/:id', courses.getChapters);

  router.get('/lessons/:id', lessons.getLessons);
  router.get('/lesson/:lessonId', lessons.getLesson);
  router.get('/lessons/header/:courseId', lessons.getLessonHeaders);
  router.get('/lesson/intro/:lessonId', lessons.getIntro);


  router.get('/exercises/:id', exercises.getExercises);
  router.get('/exercises/course/:courseId', exercises.getExercises);

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
  /* learn */

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
  
  router.get('/user/courses/learn', courses.getUserCourses);

  router.get('/user', users.getUser);

  /* build */
  router.get('/build/courses', courses.getUserCreatedCourses);
  router.get('/build/course/:courseId', courses.getAuthorCourse);
  router.post('/build/course', courses.addCourse);
  router.put('/build/course/header', courses.updateCourseHeader);
  router.patch('/build/course/property/:courseId', courses.updateCourseProperty);
  router.patch('/build/course/lesson/:courseId', courses.updateCourseLesson);
  router.put('/build/lessonIds/:courseId', courses.updateLessonIds);

  router.post('/build/chapter/:courseId', courses.addChapter);
  router.put('/build/chapter/:courseId', courses.removeChapter);
  router.put('/build/chapters/:courseId', courses.updateChapters);

  router.post('build/lesson', lessons.addLesson);
  router.put('/build/lesson/intro/:lessonId', lessons.updateIntro);
  router.put('/build/lesson/header', lessons.updateLessonHeader);
  router.delete('/build/lesson/:lessonId', lessons.removeLesson);
  
  router.get('/build/wordpairs', words.getWordPairs);
  router.get('/build/wordpair/:wordpairId', words.getWordPairDetail);
  router.get('/build/wordpair/media/:wordpairId', words.getWordDetailMedia);

  router.post('/build/exercise/:lessonId', exercises.addExercise);
  router.put('/build/exercise/:lessonId', exercises.updateExercise);
  router.put('/build/exercises/:lessonId', exercises.updateExercises);
  router.delete('/build/exercise/:lessonId/:exerciseId', exercises.removeExercise);

  app.use('/api/', router);

  app.use(function (req, res) {
    var home = path.resolve(__dirname + '/../dist/index.html');
    res.sendFile(home);
  });
};
