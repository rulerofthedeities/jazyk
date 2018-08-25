var path = require("path"),
    jwt = require('jsonwebtoken'),
    users = require("./controllers/users"),
    courses = require("./controllers/courses"),
    lessons = require("./controllers/lessons"),
    books = require("./controllers/books"),
    errors = require("./controllers/errors"),
    words = require("./controllers/words"),
    config = require("./controllers/config"),
    translations = require("./controllers/translations"),
    exercises = require("./controllers/exercises"),
    notifications = require("./controllers/notifications"),
    messages = require("./controllers/messages"),
    follows = require("./controllers/follows"),
    results = require("./controllers/results"),
    info = require("./controllers/info"),
    dashboard = require("./controllers/dashboard"),
    log = require("./controllers/log"),
    response = require("./response");

module.exports.initialize = function(app, router) {
  router.use(['/user/refresh', '/user/signin'], (req, res, next) => {
    req.expiresIn = app.get('token_expiration') || 86400;
    next();
  });

  router.post('/error', errors.addError);
  router.post('/log/page', log.logPage);

  router.get('/user/check', users.check);
  router.post('/user/signin', users.signin);
  router.post('/user/signup', users.signup);

  router.get('/user/profiles/:userIds', users.getCompactProfiles);

  router.get('/config/lan/:lan', config.getLanConfig);
  router.get('/config/lanpair/:lanLocal/:lanForeign', config.getLanPairConfig);

  router.get('/translations/:lan/:component', translations.getTranslations);
  router.get('/dependables', config.getDependables);

  // router.get('/courses/demo', courses.getDemoCourses);
  router.get('/pages/info/:page/:lan/:loggedIn', info.getPage);

  router.use('/', function(req, res, next) {
    jwt.verify(req.token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
      response.handleError(err, res, 401, 'Authentication failed', function(){
        req.decoded = decoded;
        next();
      });
    });
  });

  /*** authenticated ***/

  router.get('/learn/course/:courseId', courses.getCourse);

  router.get('/lessons/:id', lessons.getLessons);
  router.get('/lesson/:lessonId', lessons.getLesson);
  router.get('/lessons/header/:courseId', lessons.getLessonHeaders);
  router.get('/lessons/count/:courseId', lessons.getCountsByLesson);
  router.get('/lesson/intro/:lessonId', lessons.getIntro);
  router.get('/lesson/dialogue/:lessonId', lessons.getDialogue);

  router.get('/choices/course/:courseId/:lans', exercises.getCourseChoices);


  /* dashboard */
  router.get('/dashboard/count', dashboard.getCount);
  router.get('/dashboard/communication/:max', dashboard.getCommunication);
  router.get('/dashboard/courses/:max', dashboard.recentCourses);
  router.get('/dashboard/books/:max', dashboard.recentBooks);

  /* user */
  router.put('/user/settings/learn', users.saveLearnSettings);
  router.get('/user/settings/learn', users.getLearnSettings);
  router.put('/user/settings/main', users.saveMainSettings);
  router.get('/user/profile/:userName', users.getPublicProfile);
  router.get('/user/profileId/:userId', users.getPublicProfileById);
  router.get('/user/profile', users.getProfile);
  router.put('/user/profile', users.saveProfile);
  router.patch('/user/lan/learn', users.updateLearnLan);
  router.patch('/user/lan/user', users.updateUserLan);
  router.patch('/user/password', users.updatePassword);
  router.post('/user/subscribe/course', users.subscribeToCourse);
  router.post('/user/unsubscribe/course', users.unsubscribeFromCourse);
  router.post('/user/subscribe/book', users.subscribeToBook);
  router.post('/user/unsubscribe/book', users.unsubscribeFromBook);
  router.get('/user/refresh', users.refreshToken);
  router.get('/user', users.getUser);

  router.post('/user/follow', follows.followUser);
  router.put('/user/unfollow', follows.unFollowUser);
  router.get('/user/followers/:userId', follows.getFollowers);
  router.get('/user/recipients', follows.getTwoWayFollowers);

  router.put('/user/notification', notifications.saveNotification);
  router.get('/user/notifications', notifications.getNotifications);
  router.delete('/user/notifications', notifications.removeNotifications);
  router.get('/user/notificationscount', notifications.getNotificationsCount);
  router.get('/user/notification/:notificationId', notifications.getNotification);
  router.delete('/user/notification/:notificationId', notifications.removeNotification);
  router.patch('/user/notificationread', notifications.setNotificationRead);
  router.patch('/user/notificationsread', notifications.setAllNotificationsRead);

  router.put('/user/message', messages.saveMessage);
  router.get('/user/message/:messageId', messages.getMessage);
  router.get('/user/messages/:tpe', messages.getMessages);
  router.patch('/user/messageread', messages.setMessageRead);
  router.patch('/user/messagesread', messages.setAllMessagesRead);
  router.patch('/user/messagedelete', messages.setMessageDelete);
  router.patch('/user/messagesdelete', messages.setMessagesDelete);
  router.patch('/user/emptytrash', messages.setEmptyTrash);
  router.get('/user/messagescount', messages.getMessagesCount);

  router.get('/user/config/welcome/:lan', config.getWelcomeMessage);

  router.get('/user/results/lesson/overview/:lessonId', results.getLessonOverviewResults);
  router.get('/user/results/lesson/:step/:lessonId', results.getLessonResults);
  router.get('/user/results/lessons/:courseId', results.getResultsByLesson);
  router.get('/user/results/countbystep/:courseId/:lessonId', results.getStepCount);
  router.get('/user/results/course/currentlesson/:courseId', results.getCurrentLesson);
  router.get('/user/results/course/toreview/:courseId', results.getToReview);
  router.get('/user/results/course/difficult/:courseId', results.getDifficult);
  router.get('/user/results/course/summary/:courseId', results.getCourseSummary);
  router.get('/user/results/course/count/:courseId', results.getCourseCount);
  router.post('/user/results/add', results.saveResults);
  router.get('/user/score/total', results.getTotalScore);
  router.get('/user/score/courses', results.getCourseScores);
  router.get('/user/score/books', results.getBookScores);
  router.get('/user', users.getUser);

  /* learn */

  router.get('/courses/published/:lan', courses.getPublishedLanCourses);
  router.get('/user/courses/learn', courses.getSubscribedCourses);
  router.get('/courses/teaching/:userId', courses.getTeachingCourses);
  router.get('/user/courseFollowed/:courseId', courses.checkCourseFollowed);

  /* read */

  router.get('/books/published/:lan/:sort', books.getPublishedLanBooks);
  router.get('/books/user/:lan', books.getUserLanBooks);
  router.get('/book/user/:lan/:bookId', books.getUserBook);
  router.get('/book/:bookId', books.getBook);
  router.get('/book/chapter/:bookId/:chapterId/:sequence', books.getChapter);
  router.get('/book/translations/:bookId/:lan/:sentence', books.getTranslations);
  router.post('/book/translation/', books.addTranslation);
  router.get('/book/translation/:lan', books.getBookTranslations);
  router.put('/book/bookmark/:bookId/:lan', books.updateBookmark);
  router.post('/book/session', books.addSession);
  router.put('/book/session', books.updateSession);
  router.get('/book/sessions/:lan', books.getSessions);
  router.get('/book/sessions/book/:bookId/:lan', books.getBookSessions);

  /* build */
  router.get('/build/courses', courses.getAuthorCourses);
  router.get('/build/course/:courseId', courses.getAuthorCourse);
  router.post('/build/course', courses.addCourse);
  router.put('/build/course/header', courses.updateCourseHeader);
  router.patch('/build/course/property/:courseId', courses.updateCourseProperty);
  router.patch('/build/course/lesson/:courseId', courses.updateCourseLesson);
  router.put('/build/lessonIds/:courseId', courses.updateLessonIds);

  router.post('/build/chapter/:courseId/:lessonId', courses.addChapter);
  router.put('/build/chapter/:courseId', courses.removeChapter);
  router.put('/build/chapters/:courseId', courses.updateChapters);

  router.post('/build/lesson', lessons.addLesson);
  router.put('/build/lesson/intro/:lessonId', lessons.updateIntro);
  router.put('/build/lesson/dialogue/:lessonId', lessons.updateDialogue);
  router.put('/build/lesson/header', lessons.updateLessonHeader);
  router.delete('/build/lesson/:lessonId', lessons.removeLesson);

  router.get('/build/check/wpincourse/:courseId/:wpId/:wordLocal/:wordForeign', lessons.checkWordPairExists);

  router.get('/build/wordpairs', words.getWordPairs);
  router.get('/build/wordpair/:wordpairId', words.getWordPairDetail);
  router.get('/build/wordpair/media/:wordpairId', words.getWordDetailMedia);

  router.post('/build/exercise/:lessonId', exercises.addExercises);
  router.put('/build/exercise/:lessonId', exercises.updateExercise);
  router.put('/build/exercises/:lessonId', exercises.updateExercises);
  router.delete('/build/exercise/:lessonId/:exerciseId', exercises.removeExercise);

  app.use('/api/', router);

  app.use(function (req, res) {
    var home = path.resolve(__dirname + '/../dist/index.html');
    res.sendFile(home);
  });
};
