const c = require('lib/constants');
const {receive} = require('lib/utils');
const Platform = require('lib/platform');

module.exports = {
  getPrefs() {
    return receive(c.RECEIVE_PREFS, {prefs: Platform.prefs.getCurrent()});
  }
};
