'use strict';

module.exports = {
  checkWarnings: function(app) {
    // Check if required config vars are present
    if (!process.env.JWT_TOKEN_SECRET) {
      console.log('WARNING: no config var JWT_TOKEN_SECRET set!');
    }
    if (!process.env.BACKEND_URL) {
      console.log('WARNING: no config var BACKEND_URL set!');
    }
    if (!process.env.SENDGRID_API_KEY) {
      console.log('WARNING: no config var SENDGRID_API_KEY set!');
    }
    if (!process.env.DEEPL_API_KEY) {
      console.log('WARNING: no config var DEEPL_API_KEY set!');
    }
    if (!process.env.MSTRANSLATE_API_KEY) {
      console.log('WARNING: no config var MSTRANSLATE_API_KEY set!');
    }
    // Check if running in development mode
    if (app.get('env') === 'development') {
      console.log('Server running in development mode');
    }
  }
}
