const c = require("lib/constants");
const {request, receive} = require("lib/utils");
const userDatabase = require("lib/userDatabase");
const blockedLinks = require("lib/blockedLinks");
const async = require("lib/async");

module.exports = {
  initUserDatabase() {
    return async(function* (dispatch) {
      dispatch(request(c.REQUEST_INIT_USER_DATABASE));
      yield userDatabase.init();
      yield blockedLinks.init(userDatabase);
      dispatch(receive(c.REQUEST_INIT_USER_DATABASE_COMPLETE));
    }, this);
  },

  setUndoDialogVisibility(isVisible, blockedURL) {
    return receive(c.REQUEST_UNDO_DIALOG_VISIBILITY, {
      visible: isVisible,
      blockedURL: blockedURL
    });
  }
};
