const c = require("lib/constants");
const {updateState, parseBoolean} = require("lib/utils");

const initialState = {
  visible: false,
  blockedURL: undefined
};

module.exports = function Undo(prevState = initialState, action = null) {
  switch (action.type) {
    case c.REQUEST_UNDO_DIALOG_VISIBILITY:
      return updateState(prevState, {
        visible: action.visible,
        blockedURL: action.blockedURL
      });
    default:
      return prevState;
  }
};
