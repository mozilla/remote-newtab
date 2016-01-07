const assert = require('chai').assert;
const c = require('lib/constants');
const fakePrefs = require('lib/platform-placeholder').FAKE_PREFS;
const PrefsActions = require('actions/PrefsActions');
// function loadModule(fakePrefs) {
//   return require('inject!actions/PrefsActions')({
//     'lib/platform': {prefs: {getCurrent: () => fakePrefs}}
//   });
// }

describe('PrefsActions', () => {
  describe('#getPrefs', () => {
    it('should create a RECEIVE_PREFS action', () => {
      assert.deepEqual(PrefsActions.getPrefs(), {
        type: c.RECEIVE_PREFS,
        prefs: fakePrefs
      });
    });
  });
});
