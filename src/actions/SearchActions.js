const c = require('lib/constants');
const {request, receive} = require('lib/utils');
const Platform = require('lib/platform');
const async = require('lib/async');

module.exports = {
  getSuggestions(engineName, searchString) {
    return async(function* (dispatch) {
      dispatch(request(c.REQUEST_SEARCH_SUGGESTIONS));
      const body = yield Platform.search.getSuggestions({
        searchString,
        engineName
      });
      dispatch(receive(c.RECEIVE_SEARCH_SUGGESTIONS, {body}));
    }, this);
  },

  getCurrentEngine() {
    return async(function* (dispatch) {
      dispatch(request(c.REQUEST_CURRENT_SEARCH_ENGINE));
      const body = yield Platform.search.getCurrentEngine();
      dispatch(receive(c.RECEIVE_CURRENT_SEARCH_ENGINE, {body}));
    }, this);
  },

  getVisibleEngines() {
    return async(function* (dispatch) {
      dispatch(request(c.REQUEST_VISIBLE_SEARCH_ENGINES));
      const body = yield Platform.search.getVisibleEngines();
      dispatch(receive(c.RECEIVE_VISIBLE_SEARCH_ENGINES, {body}));
    }, this);
  },

  updateSearchString(searchString) {
    return receive(c.UPDATE_SEARCH_STRING, {searchString});
  }
};
