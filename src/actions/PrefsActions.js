const c = require("lib/constants");
const Comm = require("lib/comm");

module.exports = {
  getPrefs() {
   Comm.dispatch(c.REQUEST_PREFS);
  }
};
