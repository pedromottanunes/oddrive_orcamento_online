const express = require('express');

module.exports = function buildApiRouter(store, googleAuthService) {
  const router = express.Router();

  router.use('/proposals', require('./proposals')(store));
  router.use('/settings', require('./settings')(store));
  router.use('/slides', require('./slides')(store, googleAuthService));

  return router;
};
