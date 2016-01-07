module.exports.EventEmitter = class EventEmitter {
  constructor() {
    this._listeners = new Set();
  }
  dispatch(data) {
    this._listeners.forEach(listener => listener(data));
  }
  addEventListener(event, callback) {
    this._listeners.add(callback);
  }
  removeEventListener(event, callback) {
    if (callback) this._listeners.remove(callback);
    else this._listeners.clear();
  }
};

module.exports.FAKE_PREFS = new Map([
  ['browser.newtabpage.rows', 3],
  ['browser.newtabpage.columns', 5],
  ['browser.newtabpage.enabled', 'true'],
  ['browser.newtabpage.enhanced', 'true'],
  ['browser.newtabpage.pinned', undefined],
  ['browser.newtabpage.remote', 'false'],
  ['intl.locale.matchOS', 'false'],
  ['general.useragent.locale', 'en-US']
]);

module.exports.FAKE_FRECENT = [
  {
    frecency: 2000,
    lastVisitDate: 1450201129309672,
    title: null,
    type: 'history',
    url: 'http://reddit.com/'
  },
  {
    frecency: 2000,
    lastVisitDate: 1450201109951367,
    title: 'Github - Where software is built',
    type: 'history',
    url: 'https://github.com/'
  },
  {
    frecency: -1,
    lastVisitDate: 1450201129351698,
    title: 'reddit: the front page of the internet',
    url: 'https://www.reddit.com/'
  },
  {
    frecency: -1,
    lastVisitDate: 1450201123032921,
    title: 'We’re building a better Internet — Mozilla',
    type: 'history',
    url: 'https://www.mozilla.org/en-US/'
  }
];

const ICON_URI = 'data:image/x-icon;base64,AAABAAIAEBAAAAAAAAB9AQAAJgAAACAgAAAAAAAA8gIAAKMBAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAFESURBVDjLpZNJSwNBEIXnt4lE4kHxovgT9BDwJHqPy0HEEOJBiAuCRg+KUdC4QS4KrpC4gCBGE3NQ48JsnZ6eZ3UOM6gjaePhQU93v6+qq2q0pqgeJj2S8EdJT1hr0OxBtKCD5iEd8QxDYpvhvOBAuMDKURX9C9aPu4GA1GEVkzvMg10UBfYveWAWgYAP00V01fa+R9M2bA51wJvhIn3qR+ybt3D3JNQBE5sMjCIOLFpoHzOwdsLRO22qA6R6kiZiWwxUvy/PUQZIhYZ1vFM9cvcOOsYNdcBgysISdSJBnZjJMlR0Fw8vAp0xoz5gao/h+NZBy4i/10XGwrPA+hmvDyhVRG2Avu/LwcrkFADZa16L1h330w1RNgc3DiJzCpPYRm1bpveXX11clQR28xwblHpk1vq1iP/5mcoS0CoXDZiL0vsJ+dzfl+3T/VYAAAAASUVORK5CYIKJUE5HDQoaCgAAAA1JSERSAAAAIAAAACAIBgAAAHN6evQAAAK5SURBVFjDxVfrSxRRFJ9/Jta/oyWjF5XQm6D6EkHRgygIIgjUTcueVgqVWSRRkppEUQYWWB8ye1iGWilWlo/Ude489s7M6Zw7D9dlt53dmd29cFiWvXvO77x+51xpaaUsoSxBaUWZQ4ECy5xji2xKZDyCMlMEw6lCNiOSgwZKJK1SkcKeSealfP64t0mBjl4Ow39MkDUL0p2RSROOtqhZdeUEYM1pBl39XCg/fEeFtWcY7G9W4csvUxjlBkCsQ4Nt9QyWVfvT6RsAKXw3aoDGATZeYIt+W1kjw7cJG0RctWDTRebbKd8A6h5pwsDb70ba3w/eUr3wt/cmwgfw6Yft4TNMQaY7o1P2ncm4FT4ANQH/jQBJ2xv7kqIXEADDql8eS3+n8bku7oxNm+EDIM/dU92upb3T/NJGeaNbDx/AsbsLRUY5Xn92caWXY5d8RV6gWllxSg4fAEnTC90DQW13BLlgXR2D3dcUeDVkwOthA1bXspxILWcm3HdThcfvufB26LcJpkOEAz9NKI/lzqpSEC7feol5EWnpSeSlIxCALUkApmULdjUqxQVAQnl3D/X/yQda4QBEq2TYc12By091MQ17Bg3R88nHKlQbVmHvj89awNBLYrwT9zXY2aBAxTkGFdiSxP/Jp6FLDw+AS7GfsdJTJ2EqSO5khD43nGfBARy/ZxOQgZHe7GPM1jzUvChUtmnBAXQPcKGMJp3fdFGq6NByEhiAO4b/YptFfQJwNyQ/bZkVQGcf90Ja25ndIyrKBOa/f8wIpwi3X1G8UcxNu7ozUS7tiH0jBswwS3RIaF1w6LYKU/ML2+8sGnjygQswtKrVIy/Qd9qQP6LnO64q4fPAKpxyZIymHo1jWk6p1ag2BsdNwQMHcC+M5kHFJX+YlPxpVlbCx2mZ5DzPI04k4kUwHHdskU3pH76iftG8yWlkAAAAAElFTkSuQmCC';

const FAKE_ICONS = [
  {height: 16, width: 16, url: ICON_URI}
].map(icon => {
  const json = JSON.stringify(icon);
  return Object.assign(icon, {toJSON: () => json});
});

module.exports.FAKE_ENGINES = {
  currentEngine: {
    name: 'Google',
    placeholder: 'Search With Google',
    icons: FAKE_ICONS,
    performSearch(searchString) {
      window.location = `https://www.google.ca/search?q=${encodeURI(searchString)}`;
    }
  },
  engines: [
    'Yahoo',
    'Bing',
    'Amazon.com',
    'DuckDuckGo',
    'eBay',
    'Twitter',
    'Wikipedia'
  ].map(name => {
    return {
      name,
      placeholder: `Search With ${name}`,
      url: ICON_URI,
      icons: FAKE_ICONS
    };
  })
};

module.exports.FAKE_THUMBNAILS = {
  imageURI: 'http://lorempixel.com/290/180/technics',
  imageURI_2x: 'http://lorempixel.com/580/360/technics'
};
