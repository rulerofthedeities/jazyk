const path = require('path'),
      jwt = require('jsonwebtoken'),
      users = require('./controllers/users'),
      books = require('./controllers/books'),
      audio = require('./controllers/audiobooks'),
      errors = require('./controllers/errors'),
      config = require('./controllers/config'),
      translations = require('./controllers/translations'),
      notifications = require('./controllers/notifications'),
      messages = require('./controllers/messages'),
      follows = require('./controllers/follows'),
      scores = require('./controllers/scores'),
      page = require('./controllers/page'),
      dashboard = require('./controllers/dashboard'),
      log = require('./controllers/log'),
      response = require('./response');

module.exports = {
  apiEndpoints: (app, router, isSSR = false) => {
    router.use(['/user/refresh', '/user/signin'], (req, res, next) => {
      req.expiresIn = app.get('token_expiration') || 86400;
      next();
    });
    router.get('/version', config.getAppVersion);
    router.post('/error', errors.addError);
    router.post('/log/page', log.logPage);
    router.get('/user/check', users.check);
    router.post('/user/signin', users.signin);
    router.post('/user/signup', users.signup);
    router.get('/translations/:lan/:component', translations.getTranslations);
    router.get('/dependables', config.getDependables);
    router.get('/pages/booklist/:tpe', page.getBooklist);
    router.get('/pages/info/:page/:lan/:loggedIn', page.getInfoPage);
    router.get('/pages/manual/index', page.getManualIndex);
    router.get('/pages/manual/:page', page.getManualPage);
    router.get('/home/stats', dashboard.getHomeStats);
    router.post('/user/sendforgotpwmail', users.sendForgotPassword);
    router.post('/user/checkresetId', users.checkresetId);
    router.post('/user/resetpw', users.resetpw);

    router.use('/', function(req, res, next) {
      jwt.verify(req.token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
        response.handleError(err, res, 401, 'Authentication failed', () => {
          req.decoded = decoded;
          next();
        });
      });
    });

    /*** authenticated ***/

    /* dashboard */
    router.get('/dashboard/count', dashboard.getCount);
    router.get('/dashboard/communication/:max', dashboard.getRecentMail);
    router.get('/dashboard/books/:max', dashboard.recentBooks);
    router.get('/dashboard/leaders/:max', scores.getLeaders);

    /* user */
    router.post('/user/sendverificationmail', users.sendMailVerification);
    router.post('/user/checkverificationId', users.checkverificationId);
    router.put('/user/settings', users.saveSettings);
    router.put('/user/mailsettings', users.saveMailSettings);
    router.post('/user/profiles', users.getCompactProfiles);
    router.get('/user/profile/:userName', users.getPublicProfile);
    router.get('/user/profileId/:userId', users.getPublicProfileById);
    router.get('/user/profile', users.getProfile);
    router.put('/user/profile', users.saveProfile);
    router.patch('/user/lan/read', users.updateReadLan);
    router.patch('/user/lan/user', users.updateUserLan);
    router.patch('/user/password', users.updatePassword);
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
    router.get('/user/score/total/:userId', scores.getTotalScore);
    router.get('/user/score/total/', scores.getTotalScore);
    router.get('/user/score/books/:bookType', scores.getBookScores);
    router.get('/user/finishedbooks', scores.getFinishedBooks);
    router.get('/user', users.getUser);
    router.post('/users/byid', users.getUsersById);

    /* read */
    router.get('/books/published/:lan/:sort', books.getPublishedLanBooks);
    router.get('/books/user/:lan/:bookType', books.getUserLanBooks);
    router.get('/book/user/:lan/:bookId/:isTest', books.getUserBook);
    router.get('/book/user/:lan/:bookId', books.getUserBook);
    router.get('/book/:bookId', books.getBook);
    router.get('/book/chapter/:bookId/:chapterId/:sequence', books.getChapter);
    router.get('/book/translations/:bookId/:lan/:sentence', books.getTranslations);
    router.post('/book/translation/', books.addTranslation);
    router.put('/book/translation/', books.updateTranslation);
    router.get('/book/translation/:lan', books.getBookTranslations);
    router.post('/book/machinetranslation/deepl', books.getDeeplTranslation);
    router.put('/book/bookmark', books.updateBookmark);
    router.post('/book/session', books.addSession);
    router.put('/book/session', books.updateSession);
    router.get('/book/sessions/:lan/:bookType', books.getSessions);
    router.get('/book/sessions/book/:bookId/:lan', books.getBookSessions);
    router.get('/book/thumb/:bookId/:translationId', books.getThumbs);
    router.post('/book/thumb', books.addThumb);
    router.get('/book/trophies/user/:userId', books.getTrophies);
    router.get('/book/trophies/user/', books.getTrophies);
    router.post('/book/trophies', books.saveTrophies);
    router.post('/book/trophies/session', books.getSessionTrophies);
    router.post('/book/trophies/thumb', books.getThumbTrophies);
    router.post('/book/subscribe', books.subscribeToBook);
    router.put('/book/subscribe/repeat', books.subscribeRepeat);
    router.post('/book/unsubscribe', books.unsubscribeFromBook);
    router.put('/book/finished', books.setBookFinished);
    router.put('/book/recommend', books.recommend);

    router.get('/audiobooks/published/:lan/:sort', audio.getPublishedLanBooks);
    router.get('/audiobook/:bookId', audio.getBook);
    router.get('/audiobook/chapter/:bookId/:chapterId/:sequence', audio.getChapter);

    app.use('/api/', router);

    if  (!isSSR) {
      app.use( (req, res) => {
        var home = path.resolve(__dirname + '/../dist/browser/index.html');
        res.sendFile(home);
      });
    }
  },
  clientRendering: (app, router, DIST_FOLDER) => {
    const indexFile = path.join(DIST_FOLDER, 'browser', 'index.html'),
          routes = [
            '/dashboard',
            '/read',
            '/read/*',
            '/listen',
            '/listen/*',
            '/auth/*',
            '/user/*',
            '/u/:name',
            '/v/*'
          ];
    routes.forEach(route => {
      router.get(route, (req, res) => {
        res.sendFile(indexFile);
      });
    });
    app.use('/', router);
  }
}
