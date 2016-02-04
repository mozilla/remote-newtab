const c = require("lib/constants");
const Comm = require("lib/comm");
const {receive} = require("lib/utils");

module.exports = {

  getStrings() {
    Comm.dispatch(c.REQUEST_UISTRINGS);
  },

  getSuggestions(engineName, searchString) {
    const searchData = {
      engineName,
      searchString
    };
    Comm.dispatch(c.REQUEST_SEARCH_SUGGESTIONS, searchData);
  },

  manageEngines() {
    Comm.dispatch(c.REQUEST_MANAGE_ENGINES);
  },

  getState() {
    Comm.dispatch(c.REQUEST_SEARCH_STATE);
  },

  cycleEngine(engineName) {
    Comm.dispatch(c.REQUEST_CYCLE_ENGINE, engineName);
  },

  removeFormHistory(suggestion) {
    Comm.dispatch(c.REQUEST_REMOVE_FORM_HISTORY, suggestion);
  },

  updateSearchString(searchString) {
    return receive(c.UPDATE_SEARCH_STRING, {searchString});
  },

  performSearch(searchData) {
    Comm.dispatch(c.REQUEST_PERFORM_SEARCH, searchData);
  }
};
