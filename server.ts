// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { renderModuleFactory } from '@angular/platform-server';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader'; // Import module map for lazy loading
import { enableProdMode } from '@angular/core';
import { ngExpressEngine } from '@nguniversal/express-engine';

import * as express from 'express';
import checks = require('./server/checks.js');
import routes = require('./server/routes');
import sslRedirect = require('heroku-ssl-redirect');
import compression = require('compression');
import bodyParser = require('body-parser');
import * as cookieParser from 'cookie-parser';
import bearerToken = require('express-bearer-token');
import {mongoose} from './server/mongoose';
import https = require('https');
import fs = require('fs');
import { join } from 'path';
import { readFileSync } from 'fs';

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

const DIST_FOLDER = join(process.cwd(), 'dist');

// Express server
const app = express();
// config
app.set('port', process.env.PORT || 9000);
app.set('env', process.env.NODE_ENV || 'development');
app.set('token_expiration', 604800); // Token expires after 7 days
// check for warnings
checks.checkWarnings(app);
// middleware

app.use(compression());
app.use(bearerToken());
app.use(sslRedirect());
app.use(bodyParser.json());
app.use(cookieParser(process.env.JWT_TOKEN_SECRET));

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./dist/server/main');

// Our index.html we'll use as our template
const template = readFileSync(join(DIST_FOLDER, 'browser', 'index.html')).toString();
// allow window and document
const domino = require('domino');
const win = domino.createWindow(template);
global['window'] = win;
global['document'] = win.document;

/*
app.engine('html', (_, options, callback) => {
  renderModuleFactory(AppServerModuleNgFactory, {
    // Our index.html
    document: template,
    url: options.req.url,
    // DI so that we can get lazy-loading to work differently (since we need it to just instantly render it)
    extraProviders: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
  }).then(html => {
    callback(null, html);
  });
});
*/

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP),
    // In case you want to use an AppShell with SSR and Lazy loading
    // you'd need to uncomment the below. (see: https://github.com/angular/angular-cli/issues/9202)
    // {
    //   provide: NgModuleFactoryLoader,
    //   useClass: ModuleMapNgFactoryLoader,
    //   deps: [
    //     Compiler,
    //     MODULE_MAP
    //   ],
    // },
  ]
}));

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, 'browser'));

// Routes
// routes.apiEndpoints(app, new express.Router(), DIST_FOLDER);


// Server static files from /browser
app.get('*.*', express.static(join(DIST_FOLDER, 'browser'), {
  maxAge: '1y'
}));

app.get('*', (req, res) => {
  res.render('index', {
    req: req,
    res: res,
    providers: [
      {
        provide: 'REQUEST', useValue: (req)
      },
      {
        provide: 'RESPONSE', useValue: (res)
      }
    ]
  });
});

// server
if (app.get('env') === 'development') {
  const options = {
    key: fs.readFileSync('../ssl/jazyk.key'),
    cert: fs.readFileSync('../ssl/jazyk.cer')
  };
  https.createServer(options, app).listen(app.get('port'), () => {
    console.log('Local https server running on port ' + app.get('port'));
  });
} else {
  app.listen(app.get('port'), () => {
    console.log('Server running on port ' + app.get('port'));
  });
}
