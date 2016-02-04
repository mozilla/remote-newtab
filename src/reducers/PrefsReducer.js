const c = require("lib/constants");
const {updateState} = require("lib/utils");
const Comm = require("lib/comm");

const initialState = {
  locale: "en-US",
  enabled: true,
  enhanced: true,
  pinned: null,
  blocked: null,
  introShown: false,
  updateIntroShown: false,
  visibleEngines: null
};

module.exports = function Prefs(prevState = initialState, action = {}) {
  const {type, data} = action;
  switch (type) {
    case c.RECEIVE_PREFS:
      if (data["browser.search.hiddenOneOffs"] !== prevState.visibleEngines) {
        Comm.dispatch(c.REQUEST_SEARCH_STATE);
      }
      return updateState(prevState, {
        locale: data["general.useragent.locale"] || prevState.locale,
        enabled: data["browser.newtabpage.enabled"] || prevState.enabled,
        enhanced: data["browser.newtabpage.enhanced"] || prevState.enhanced,
        pinned: data["browser.newtabpage.pinned"] || prevState.pinned,
        blocked: data["browser.newtabpage.blocked"] || prevState.blocked,
        introShown: data["browser.newtabpage.introShown"] || prevState.introShown,
        updateIntroShown: data["browser.newtabpage.updateIntroShown"] || prevState.updateIntroShown,
        visibleEngines: data["browser.search.hiddenOneOffs"] || prevState.visibleEngines
      });
    default:
      return prevState;
  }
};
