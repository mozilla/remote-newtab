const c = require('lib/constants');
const {updateState} = require('lib/utils');

const initialState = {
  isInitialized: false
};

module.exports = function Search(prevState = initialState, action = null) {
  switch (action.type) {
    case c.UPDATE_SEARCH_STRING:
      return updateState(prevState, {
        searchString: action.searchString
      });
    default:
      return prevState;
  }
};