const c = require('lib/constants');
const {request, receive} = require('lib/utils');
const gUserDatabase = require('lib/userDatabase');
const gBlockedLinks = require('lib/blockedLinks');
const async = require('lib/async');

const {log} = require('lib/log');

module.exports = {
  initUserDatabase() {
    return async(function* (dispatch) {
      dispatch(request(c.REQUEST_INIT_USER_DATABASE));
      yield gUserDatabase.init();
      yield gBlockedLinks.init(gUserDatabase);
      dispatch(receive(c.REQUEST_INIT_USER_DATABASE_COMPLETE));
    }, this);
  },
};