const c = require('lib/constants');
const Comm = require('lib/comm');
const {request, receive} = require('lib/utils');
const relayEvents = new Map([
  'NewTab:ContentSearchService'
].map(event => [event, event]));

// This triggers actions received from comm
// NOTE: All case statements MUST be in relayEvents
function commRelay(dispatch) {
  return function onMessage(event, data) {
    switch (event) {
      case relayEvents.get('NewTab:ContentSearchService'):
        switch (data.name) {
          case 'Suggestions':
            return dispatch(receive(c.RECEIVE_SEARCH_SUGGESTIONS, {suggestions: data.suggestion.remote}));
          default:
            return null;
        }
        break;
      default:
        return null;
    }
  };
}

module.exports = {
  initComm() {
    return function next(dispatch) {
      dispatch(request(c.REQUEST_INIT));
      // Get history and start listening for events
      // TODO: Replace with platform places API
      Comm.init(initialState => {
        // Set up relay
        Comm.all(relayEvents, commRelay(dispatch));

        dispatch(receive(c.RECEIVE_INIT, {history: initialState.placesLinks}));
      });
    };
  },

  // Old message passing
  getSearchSuggestions(searchString) {
    return function next(dispatch) {
      dispatch(request(c.REQUEST_SEARCH_SUGGESTIONS));
      Comm.dispatch('NewTab:GetSuggestions', {
        engineName: 'Google',
        searchString,
        remoteTimeout: undefined
      });
    };
  }

};
