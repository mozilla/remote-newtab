const c = require("lib/constants");
const {receive} = require("lib/utils");

module.exports = {
  setUndoDialogVisibility(isVisible, blockedURL) {
    return receive(c.REQUEST_UNDO_DIALOG_VISIBILITY, {
      visible: isVisible,
      blockedURL: blockedURL
    });
  },
};
