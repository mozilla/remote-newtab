const c = require('lib/constants');
const {updateState} = require('lib/utils');

const initialState = {
  isReady: false,
  isLoading: false
};

module.exports = function Comm(prevState = initialState, action) {
  switch (action.type) {
    case c.REQUEST_INIT:
      return updateState(prevState, {
        isLoading: true
      });
    case c.RECEIVE_INIT:
      return updateState(prevState, {
        isLoading: false,
        isReady: true
      });
    default:
      return prevState;
  }
};
