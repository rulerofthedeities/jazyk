'use strict';

const path = require('path'),
      jwt = require('jsonwebtoken'),
      users = require('./controllers/users'),
      books = require('./controllers/books'),
      audio = require('./controllers/audiobooks'),
      errors = require('./controllers/errors'),
      config = require('./controllers/config'),
      notifications = require('./controllers/notifications'),
      messages = require('./controllers/messages'),
      profiles = require('./controllers/profiles'),
      follows = require('./controllers/follows'),
      scores = require('./controllers/scores'),
      page = require('./controllers/page'),
      dashboard = require('./controllers/dashboard'),
      revision = require('./controllers/revision'),
      wordlist = require('./controllers/wordlist'),
      dictionaries = require('./controllers/dictionaries'),
      log = require('./controllers/log'),
      response = require('./response');

module.exports = {
  apiEndpoints: (app, router, rateLimit, isSSR = false) => {
    const apiSignupLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5
      })
    router.use(['/user/refresh', '/user/signin'], (req, res, next) => {
      req.expiresIn = app.get('token_expiration') || 86400;
      next();
    });
    router.get('/version', config.getAppVersion);
    router.post('/error', errors.addError);
    router.post('/log/page', log.logPage);
    router.get('/user/check', users.check);
    router.post('/user/signin', users.signin);
    router.post('/user/signup', users.signup, apiSignupLimiter);
    router.get('/translations/:lan/:component', config.getTranslations);
    router.get('/dependables', config.getDependables);
    router.get('/pages/booklist/:tpe', page.getBooklist);
    router.get('/pages/info/:page/:lan/:loggedIn', page.getInfoPage);
    router.get('/pages/manual/index', page.getManualIndex);
    router.get('/pages/manual/:page', page.getManualPage);
    router.get('/home/stats', dashboard.getHomeStats);
    router.post('/user/sendforgotpwmail', users.sendForgotPassword);
    router.post('/user/checkresetId', users.checkresetId);
    router.post('/user/resetpw', users.resetpw);

    router.use('/', (req, res, next) => {
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
    router.get('/dashboard/leaders/:period/:max', scores.getLeaders);
    router.get('/dashboard/leaderrank/:period/:userId', scores.getLeaderRank)
    router.post('/dashboard/leadersbyid/:period/:max', scores.getLeadersById);
    /* user */
    router.post('/user/sendverificationmail', users.sendMailVerification);
    router.post('/user/checkverificationId', users.checkverificationId);
    router.put('/user/settings', users.saveSettings);
    router.put('/user/mailsettings', users.saveMailSettings);
    router.post('/user/profiles', profiles.getCompactProfiles);
    router.get('/user/profile/:userName', profiles.getPublicProfile);
    router.get('/user/profileId/:userId', profiles.getPublicProfileById);
    router.get('/user/profile', profiles.getProfile);
    router.put('/user/profile', profiles.saveProfile);
    router.patch('/user/lan/read', users.updateReadLan);
    router.patch('/user/lan/user', users.updateUserLan);
    router.patch('/user/password', users.updatePassword);
    router.get('/user/refresh', users.refreshToken);
    router.get('/user', users.getUser);
    router.post('/user/follow', follows.followUser);
    router.put('/user/unfollow', follows.unFollowUser);
    router.get('/user/followers/:userId', follows.getFollowers);
    router.get('/user/following', follows.getFollowing);
    router.get('/user/recipients', follows.getRecipients);
    router.get('/user/admins', users.getAdmins);
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
    router.get('/books/count/read', books.getBooksCount);
    router.get('/books/activity/:lan/:bookType', books.getActivity)
    router.get('/book/user/:lan/:bookId/:bookType/:isTest', books.getUserBook);
    router.get('/book/user/:lan/:bookId/:bookType', books.getUserBook);
    router.get('/books/book/:bookId/:bookType', books.getBook);
    router.get('/book/chapter/:bookId/:sequence', books.getChapter);
    router.get('/book/audiochapter/:bookId/:sequence', audio.getAudioChapter);
    router.get('/book/chapterheaders/:bookId', books.getChapterHeaders);
    router.get('/book/translations/:bookId/:lan/:chapterSequence/:sentence', books.getTranslations);
    router.post('/book/translation/', books.addTranslation);
    router.put('/book/translation/', books.updateTranslation);
    router.get('/book/translation/:lan', books.getTranslationsCount);
    router.post('/book/machinetranslation/deepl', books.getDeeplTranslation);
    router.post('/book/machinetranslation/microsoft', books.getMicrosoftTranslation);
    router.put('/book/bookmark', books.updateBookmark);
    router.post('/book/session', books.addSession);
    router.put('/book/session', books.updateSession);
    router.put('/book/sessionchange', books.changeSessionAnswer);
    router.get('/book/sessions/:lan/:bookType', books.getSessions);
    router.get('/book/sessions/book/:bookId/:bookType/:lan', books.getBookSessions);
    router.get('/book/sessions/latest/:bookId/:bookType/:lan/:isTest', books.getLastestSession);
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
    router.get('/books/count/listen', audio.getBooksCount);
    router.get('/audiobook/chapter/:bookId/:sequence', audio.getChapter);
    router.get('/audiobook/chapterheaders/:bookId', audio.getChapterHeaders);

    router.get('/revision/sessions/:bookId/:bookType/:lan', revision.getSessionData);
    router.get('/revision/chapter/:chapterId', revision.getChapterData);
    router.get('/revision/translations/:bookId/:bookLan/:userLan/:chapterSequence', revision.getTranslationData);

    /* glossaries */

    router.get('/books/count/glossary', wordlist.getBooksCount);
    router.get('/wordlists/published/:lan/:sort', wordlist.getPublishedLanGlossaries);

    router.get('/wordlist/:bookId', wordlist.getWordList);
    router.get('/wordlist/:bookId/:lan/:sequence', wordlist.getChapterWordList);
    router.get('/userwordlist/:bookId/:lan', wordlist.getUserWordList);
    router.get('/userwordlists/count/:lan/:targetLan', wordlist.getUserWordListCount);
    router.get('/bookwordlists/count/:lan/:targetLan', wordlist.getBookWordListCount);
    router.put('/userwordlist/word', wordlist.updateUserWordTranslation);
    router.get('/userwordlist/flashcards/:bookId/:lan/:max', wordlist.getMyFlashcardWords);
    router.get('/wordlist/flashcards/:bookId/:lan/:max', wordlist.getAllFlashcardWords);
    router.post('/wordlist/flashcards/session', wordlist.addSession);
    router.post('/wordlist/flashcards/answers', wordlist.saveAnswers);
    router.put('/wordlist/my/pin', wordlist.updateMyList);
    router.put('/wordlist/my/unpin', wordlist.removeFromMyList);
    router.put('/wordlist/my/pins', wordlist.addAllToMyList);
    router.get('/wordlist/word/definition/omega/local/:word', dictionaries.getOmegawikiDefinitionsLocal);
    router.get('/wordlist/word/definition/omega/ext/:word', dictionaries.getOmegawikiDefinitionsExt);
    router.get('/wordlist/word/translate/omega/:lanId/:dmid', dictionaries.getOmegawikiTranslation);
    router.post('/wordlist/word/definition/omega', dictionaries.saveOmegaDefinitions);
    router.post('/wordlist/word/translation', dictionaries.saveTranslation);
    // router.put('/wordlist/letter/translations', dictionaries.getLetterTranslations);
    router.put('/wordlist/all/translations', dictionaries.getAllTranslations);
    router.put('/wordlist/word/translation', dictionaries.updateTranslation);
    router.put('/wordlist/word/removetranslation', dictionaries.removeTranslation);
    router.put('/wordlist/word/translationtonone', dictionaries.translationtonone);
    router.put('/wordlist/word/translationtolower', dictionaries.translationToLower);
    router.put('/wordlist/summary', wordlist.updateSummary);

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
            '/leaderboard',
            '/read',
            '/read/*',
            '/listen',
            '/listen/*',
            '/glossaries',
            '/glossaries/*',
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
