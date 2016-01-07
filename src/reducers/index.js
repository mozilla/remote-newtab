
// This is the shape of our application's state object
// See each file's "initialState" for more detail
module.exports = {
  Search: require('reducers/SearchReducer'),
  Sites: require('reducers/SitesReducer'),
  Prefs: require('reducers/PrefsReducer'),
  // TODO: remove when we get rid of all comm stuff
  Comm: require('reducers/CommReducer')
};
