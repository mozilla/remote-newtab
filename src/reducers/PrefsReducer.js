const c = require('lib/constants');
const {updateState, parseBoolean} = require('lib/utils');

const initialState = {
  locale: 'en-US',
  enabled: true,
  showSuggested: true
};

module.exports = function Prefs(prevState = initialState, action = null) {
  switch (action.type) {
    case c.RECEIVE_PREFS:
      return updateState(prevState, {
        locale: action.prefs.get('general.useragent.locale'),
        enabled: parseBoolean(action.prefs.get('browser.newtabpage.enabled')),
        showSuggested: parseBoolean(action.prefs.get('browser.newtabpage.enhanced'))
      });
    default:
      return prevState;
  }
};
