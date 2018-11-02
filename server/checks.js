'use strict';

module.exports = {
  checkWarnings: function(app) {
    // Check if required config vars are present
    if (!process.env.JWT_TOKEN_SECRET) {
      console.log('WARNING: no config var JWT_TOKEN_SECRET set!!');
    }
    if (!process.env.BACKEND_URL) {
      console.log('WARNING: no config var BACKEND_URL set!!');
    }
    // Check if running in development mode
    if (app.get('env') === 'development') {
      console.log('Server running in development mode');
    }
  }
}
