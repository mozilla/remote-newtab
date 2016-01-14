const c = require("lib/constants");
const {request, receive} = require("lib/utils");
const Platform = require("lib/platform");
const async = require("lib/async");

module.exports = {
  getSiteThumbnail(url) {
    return function next(dispatch) {
      dispatch(request(c.REQUEST_SCREENSHOT));
      Platform.places.getThumbnail(url)
        .then(response => dispatch(receive(c.RECEIVE_SCREENSHOT, Object.assign({url}, response))));
    };
  },

  getSuggestedDirectory(locale, channel = "nightly") {
    return function next(dispatch) {
      dispatch(request(c.REQUEST_SUGGESTED_DIRECTORY));
      return fetch(`https://tiles.services.mozilla.com/v3/links/fetch/${locale}/${channel}`)
        .then(response => response.json())
        .then(response => dispatch(receive(c.RECEIVE_SUGGESTED_DIRECTORY, response)));
    };
  },

  getFrecentSites() {
    return async(function* (dispatch) {
      dispatch(request(c.REQUEST_FRECENT));
      const sites = yield Platform.places.getFrecentSites();
      sites.forEach(site => dispatch(this.getSiteThumbnail(site.url)));
      dispatch(receive(c.RECEIVE_FRECENT, {sites}));
    }, this);
  }
};
