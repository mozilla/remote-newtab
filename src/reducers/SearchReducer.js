const c = require("lib/constants");
const {updateState} = require("lib/utils");

const initialState = {
  isLoading: false,
  searchString: "",
  suggestions: [],
  formHistory: [],
  currentEngine: {
    name: "",
    placeholder: "",
    icons: []
  },
  engines: [],
  searchOptions: [],
  searchPlaceholder: "",
  searchSettings: "",
  searchHeader: "",
  searchForSomethingWith: ""
};

module.exports = function Search(prevState = initialState, action = {}) {
  const {type, data} = action;
  switch (type) {
    case c.RECEIVE_UISTRINGS:
      return updateState(prevState, {
        searchPlaceholder: data.searchPlaceholder,
        searchSettings: data.searchSettings,
        searchHeader: data.searchHeader,
        searchForSomethingWith: data.searchForSomethingWith
      });
    case c.RECEIVE_SEARCH_SUGGESTIONS:
      return updateState(prevState, {
        formHistory: data.local || [],
        searchString: data.term,
        suggestions: data.remote || []
      });
    case c.RECEIVE_SEARCH_STATE:
      return updateState(prevState, {
        currentEngine: {
          name: data.currentEngine.name,
          placeholder: data.currentEngine.placeholder,
          icons: {
            url: data.currentEngine.iconBuffer,
            height: 16,
            width: 16
          }
        },
        engines: data.engines.map(engine => ({
          name: engine.name,
          placeholder: engine.placeholder,
          icons: {
            url: engine.iconBuffer,
            height: 16,
            width: 16
          }
        }))
      });
    case c.RECEIVE_CURRENT_ENGINE:
      return updateState(prevState, {
        currentEngine: {
          name: data.name,
          placeholder: data.placeholder,
          icons: {
            url: data.iconBuffer,
            height: 16,
            width: 16
          }
        }
      });
    case c.UPDATE_SEARCH_STRING:
      return updateState(prevState, {
        searchString: data.searchString
      });
    default:
      return prevState;
  }
};
