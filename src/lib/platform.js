const {FAKE_PREFS, FAKE_FRECENT, FAKE_ENGINES, FAKE_THUMBNAILS, EventEmitter} = require('lib/platform-placeholder');

class Prefs extends EventEmitter {
  getCurrent() {
    return FAKE_PREFS;
  }
  set(prefs) {
    Object.keys(prefs).forEach(key => FAKE_PREFS.set(key, prefs[key]));
    this.dispatch(FAKE_PREFS);
  }
}

class Places extends EventEmitter {
  getFrecentSites() {
    return new Promise(resolve => resolve(FAKE_FRECENT));
  }
  getThumbnail() {
    return new Promise(resolve => resolve(FAKE_THUMBNAILS));
  }
}

class Search extends EventEmitter {
  getVisibleEngines() {
    return new Promise(resolve => resolve(FAKE_ENGINES.engines));
  }
  getCurrentEngine() {
    return new Promise(resolve => resolve(FAKE_ENGINES.currentEngine));
  }
  getSuggestions({searchString = '', engineName = 'Yahoo'} = {}) {
    return new Promise(resolve => {
      resolve({
        engineName,
        searchString,
        formHistory: [''],
        remote: [
          searchString,
          searchString + ' rules',
          searchString + ' is cool',
          searchString + ' sucks',
          searchString + ' is ok'
        ]
      });
    });
  }
  performSearch({engineName = 'Google', searchString = '', healthReportKey = '1', searchPurpose = 'd'} = {}) {
    switch (engineName) {
      case 'Google':
        window.location = `https://www.google.ca/search?q=${encodeURI(searchString)}`;
        break;
      default:
        window.location = `https://ca.search.yahoo.com/search?q=${encodeURI(searchString)}`;
    }
  }
  manageEngines() {
    // this opens about:preferences#search
  }
}

const WebPlatform = {
  prefs: new Prefs(),
  places: new Places(),
  search: new Search()
};

// navigator.mozNewTab.sites.getSuggestions = WebPlatform.search.getSuggestions;
// navigator.mozNewTab.sites = WebPlatform.sites;

module.exports = navigator.mozNewTab || WebPlatform;
