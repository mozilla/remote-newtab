/* jshint node:true, esnext:true */

const c = require("lib/constants");
const {updateState} = require("lib/utils");

const initialState = {
  isInitialized: false,
  visible: false,
  blockedURL: null
};

module.exports = function Search(prevState = initialState, action = null) {
  switch (action.type) {
    case c.REQUEST_INIT_USER_DATABASE:
      return updateState(prevState, {
        isInitialized: true
      });
    case c.REQUEST_UNDO_DIALOG_VISIBILITY:
      return updateState(prevState, {
        visible: action.visible,
        blockedURL: action.blockedURL
      });
    default:
      return prevState;
  }
};
