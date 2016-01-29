const c = require("lib/constants");
const {updateState, parseBoolean} = require("lib/utils");

const initialState = {
  locale: "en-US",
  enabled: true,
  showSuggested: true
};

module.exports = function Prefs(prevState = initialState, action = {}) {
  const {type, data} = action;
  switch (type) {
    case c.RECEIVE_PREFS:
      return updateState(prevState, {
        locale: data.prefs.get("general.useragent.locale"),
        enabled: parseBoolean(data.prefs.get("browser.newtabpage.enabled")),
        showSuggested: parseBoolean(data.prefs.get("browser.newtabpage.enhanced"))
      });
    default:
      return prevState;
  }
};
