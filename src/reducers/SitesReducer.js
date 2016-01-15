const c = require("lib/constants");
const TileUtils = require("lib/TileUtils");
const {updateState} = require("lib/utils");

const initialState = {
  suggested: [],
  directory: [],

  // This is frecent sites.
  // we could rename it to frecent
  history: [],

  isSuggestedLoading: false,
  isHistoryLoading: false
};

module.exports = function Sites(prevState = initialState, action = {}) {
  const {type, data} = action;
  switch (type) {
    case c.REQUEST_SUGGESTED_DIRECTORY:
      return updateState(prevState, {
        isSuggestedLoading: true
      });
    case c.RECEIVE_SUGGESTED_DIRECTORY:
      return updateState(prevState, {
        isSuggestedLoading: false,
        suggested: data.suggested,
        directory: TileUtils.formatDirectoryTiles(data.directory)
      });
    case c.REQUEST_FRECENT:
      return updateState(prevState, {isHistoryLoading: true});
    case c.RECEIVE_FRECENT:
      return updateState(prevState, {
        isHistoryLoading: false,
        history: TileUtils.formatHistoryTiles(data.sites)
      });
    case c.REQUEST_SCREENSHOT:
      return prevState;
      // TODO: set loading prevState on individual tile
    case c.RECEIVE_SCREENSHOT:
      return updateState(prevState, {
        history: prevState.history.slice().map(tile => {
          if (tile.url !== data.url) return tile;
          return updateState(tile, {imageURI: data.imageURI, imageURI_2x: data.imageURI_2x});
        })
      });
    case c.RECEIVE_REMOVE_SITE:
      return updateState(prevState, {
        directory: TileUtils.formatDirectoryTiles(prevState.directory)
      });

    // LEGACY
    case c.REQUEST_INIT:
      return updateState(prevState, {isHistoryLoading: true});
    case c.RECEIVE_INIT:
      return updateState(prevState, {
        isHistoryLoading: false,
        history: TileUtils.formatHistoryTiles(action.history)
      });

    default:
      return prevState;
  }
};
