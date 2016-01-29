const c = require("lib/constants");
const {updateState} = require("lib/utils");

const initialState = {
  isLoading: false,
  searchString: "",
  suggestions: [],
  currentEngine: {
    name: "",
    placeholder: "",
    icons: []
  },
  engines: [],
  searchOptions: []
};

module.exports = function Search(prevState = initialState, action = {}) {
  const {type, data} = action;
  switch (type) {
    case c.UPDATE_SEARCH_STRING:
      return updateState(prevState, {
        searchString: data.searchString
      });
    case c.REQUEST_SEARCH_SUGGESTIONS:
      return updateState(prevState, {
        isLoading: true
      });
    case c.RECEIVE_SEARCH_SUGGESTIONS:
      return updateState(prevState, {
        isLoading: false,
        suggestions: data.remote || []
      });
    case c.REQUEST_CURRENT_SEARCH_ENGINE:
      return updateState(prevState, {
        isLoading: true
      });
    case c.RECEIVE_CURRENT_SEARCH_ENGINE:
      return updateState(prevState, {
        isLoading: false,
        currentEngine: {
          name: data.name,
          placeholder: data.placeholder,
          icons: data.icons.map(icon => JSON.parse(icon.toJSON()))
        }
      });
    case c.REQUEST_VISIBLE_SEARCH_ENGINES:
      return updateState(prevState, {
        isLoading: true
      });
    case c.RECEIVE_VISIBLE_SEARCH_ENGINES:
      return updateState(prevState, {
        isLoading: false,
        engines: data.map(engine => ({
          name: engine.name,
          placeholder: engine.placeholder,
          icons: engine.icons.map(icon => JSON.parse(icon.toJSON()))
        }))
      });
    default:
      return prevState;
  }
};
