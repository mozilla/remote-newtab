const constants = {
  SUGGESTED_TILES_URL: "https://tiles.services.mozilla.com/v3/links/fetch/en-US/nightly"
};

// Add action names
[
  "REQUEST_SCREENSHOT",
  "RECEIVE_SCREENSHOT",
  "REQUEST_SUGGESTED_DIRECTORY",
  "RECEIVE_SUGGESTED_DIRECTORY",
  "REQUEST_INIT",
  "RECEIVE_INIT",
  "RECEIVE_PREFS",
  "REQUEST_SEARCH_SUGGESTIONS",
  "RECEIVE_SEARCH_SUGGESTIONS",
  "UPDATE_SEARCH_STRING",
  "REQUEST_CURRENT_SEARCH_ENGINE",
  "RECEIVE_CURRENT_SEARCH_ENGINE",
  "REQUEST_VISIBLE_SEARCH_ENGINES",
  "RECEIVE_VISIBLE_SEARCH_ENGINES",
  "REQUEST_FRECENT",
  "RECEIVE_FRECENT"
].forEach(action => constants[action] = action);

module.exports = constants;
