// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

// import { renderModuleFactory } from '@angular/platform-server';
import { provideModuleMap, ModuleMapNgFactoryLoader} from '@nguniversal/module-map-ngfactory-loader'; // Import module map for lazy loading
import { enableProdMode, NgModuleFactoryLoader, Compiler, InjectionToken } from '@angular/core';
import { ngExpressEngine } from '@nguniversal/express-engine';
import { REQUEST, RESPONSE } from '@nguniversal/express-engine/tokens';

import * as express from 'express';
import checks = require('./server/checks.js');
import routes = require('./server/routes');
import mongoose = require('./server/mongoose-ssr');
import sslRedirect = require('heroku-ssl-redirect');
import compression = require('compression');
import bodyParser = require('body-parser');
import * as cookieParser from 'cookie-parser';
import bearerToken = require('express-bearer-token');
import { join } from 'path';
import { readFileSync } from 'fs';
// import { ModuleMap } from './module-map';

// export const MODULE_MAP: InjectionToken<ModuleMap> = new InjectionToken('MODULE_MAP');

// Faster server renders w/ Prod mode
enableProdMode();

const DIST_FOLDER = join(process.cwd(), 'dist');

// Express server
const app = express();
// config
app.set('port', process.env.PORT || 9000);
app.set('env', process.env.NODE_ENV || 'development');
app.set('host', process.env.BACKEND_URL || '');
app.set('token_expiration', 604800); // Token expires after 7 days
// check for warnings
checks.checkWarnings(app);
// middleware
app.use(compression());
app.use(bearerToken());
app.use(sslRedirect());
app.use(bodyParser.json());
app.use(cookieParser(process.env.JWT_TOKEN_SECRET));

// console.log('NODE_TLS_REJECT_UNAUTHORIZED', process.env.NODE_TLS_REJECT_UNAUTHORIZED);

// Our index.html we'll use as our template
const template = readFileSync(join(DIST_FOLDER, 'browser', 'index.html')).toString();

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./dist/server/main');

// allow window and document
const domino = require('domino');
const win = domino.createWindow(template);
global['window'] = win;
global['document'] = win.document;

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)

app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP),
    // In case you want to use an AppShell with SSR and Lazy loading
    // you'd need to uncomment the below. (see: https://github.com/angular/angular-cli/issues/9202)
    // {
    //  provide: NgModuleFactoryLoader,
    //  useClass: ModuleMapNgFactoryLoader,
    //  deps: [
    //    Compiler,
    //    MODULE_MAP
    //  ],
    // },
  ]
}));

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, 'browser'));

// API routes
routes.apiEndpoints(app, express.Router(), true);
// Use client rendering for all routes that require authorization -> shows app loader i.o. login
routes.clientRendering(app, express.Router(), DIST_FOLDER);

// Server static files from /browser
app.get('*.*', express.static(join(DIST_FOLDER, 'browser'), {
  maxAge: '1y'
}));

// Server render
app.get('*', (req, res) => {
  res.render('index', {
    req,
    res,
    originUrl: app.get('host'),
    providers: [
      {
        provide: REQUEST,
        useValue: req,
      },
      {
        provide: RESPONSE,
        useValue: res,
      },
      {
        provide: 'ORIGIN_URL',
        useValue: app.get('host')
      }
    ],
    async: true
  }, (err: Error, html: string) => {
    res.status(html ? 200 : 500).send(html || err.message);
  });
});

// Connect to db and start server
mongoose.runServer(app, err => {
  if (err) {
    console.error(err);
  }
});
