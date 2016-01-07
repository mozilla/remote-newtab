const c = require('lib/constants');
const TileUtils = require('lib/TileUtils');
const {updateState} = require('lib/utils');

const initialState = {
  suggested: [],
  directory: [],

  // This is frecent sites.
  // we could rename it to frecent
  history: [],

  isSuggestedLoading: false,
  isHistoryLoading: false
};

module.exports = function Sites(prevState = initialState, action = null) {
  switch (action.type) {
    case c.REQUEST_SUGGESTED_DIRECTORY:
      return updateState(prevState, {
        isSuggestedLoading: true
      });
    case c.RECEIVE_SUGGESTED_DIRECTORY:
      return updateState(prevState, {
        isSuggestedLoading: false,
        suggested: action.suggested,
        directory: TileUtils.formatDirectoryTiles(action.directory)
      });
    case c.REQUEST_FRECENT:
      return updateState(prevState, {isHistoryLoading: true});
    case c.RECEIVE_FRECENT:
      return updateState(prevState, {
        isHistoryLoading: false,
        history: TileUtils.formatHistoryTiles(action.sites)
      });
    case c.REQUEST_SCREENSHOT:
      return prevState;
      // TODO: set loading prevState on individual tile
    case c.RECEIVE_SCREENSHOT:
      return updateState(prevState, {
        history: prevState.history.slice().map(tile => {
          if (tile.url !== action.url) return tile;
          return updateState(tile, {imageURI: action.imageURI, imageURI_2x: action.imageURI_2x});
        })
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
