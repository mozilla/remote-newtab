const assert = require('chai').assert;
const c = require('lib/constants');
const configureMockStore = require('redux-mock-store');
const SearchActions = require('actions/SearchActions');

const {currentEngine, engines} = require('lib/platform-placeholder').FAKE_ENGINES;
const mockStore = configureMockStore([require('redux-thunk')]);

describe('SearchActions', () => {
  describe('#getSuggestions', () => {
    it('should dispatch the right actions', done => {
      const suggestions = ['hello', 'hello rules', 'hello is cool', 'hello sucks', 'hello is ok'];
      const expectedActions = [
        {type: c.REQUEST_SEARCH_SUGGESTIONS},
        {
          type: c.RECEIVE_SEARCH_SUGGESTIONS,
          body: {
            engineName: 'Google',
            searchString: 'hello',
            formHistory: [ '' ],
            remote: suggestions
          }
        },
      ];
      const store = mockStore({search: {}}, expectedActions, done);
      store.dispatch(SearchActions.getSuggestions('Google', 'hello'));
    });
  });
  describe('#getCurrentEngine', () => {
    it('should dispatch the right actions', done => {
      const expectedActions = [
        {type: c.REQUEST_CURRENT_SEARCH_ENGINE},
        {type: c.RECEIVE_CURRENT_SEARCH_ENGINE, body: currentEngine},
      ];
      const store = mockStore({search: {}}, expectedActions, done);
      store.dispatch(SearchActions.getCurrentEngine());
    });
  });
  describe('#getVisibleEngines', () => {
    it('should dispatch the right actions', done => {
      const expectedActions = [
        {type: c.REQUEST_VISIBLE_SEARCH_ENGINES},
        {type: c.RECEIVE_VISIBLE_SEARCH_ENGINES, body: engines},
      ];
      const store = mockStore({search: {}}, expectedActions, done);
      store.dispatch(SearchActions.getVisibleEngines());
    });
  });
  describe('#updateSearchString', () => {
    it('should create an UPDATE_SEARCH_STRING action', () => {
      assert.deepEqual(SearchActions.updateSearchString('hello'), {
        type: c.UPDATE_SEARCH_STRING,
        searchString: 'hello'
      });
    });
  });
});
