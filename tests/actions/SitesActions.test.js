const assert = require("chai").assert;
const c = require("lib/constants");
const configureMockStore = require("redux-mock-store");
const SitesActions = require("actions/SitesActions");

const {FAKE_FRECENT, FAKE_THUMBNAILS} = require("lib/platform-placeholder");
const mockStore = configureMockStore([require("redux-thunk")]);

describe("SitesActions", () => {
  describe("#getSiteThumbnail", () => {
    it("should dispatch the right actions", done => {
      const expectedActions = [
        {type: c.REQUEST_SCREENSHOT},
        {
          type: c.RECEIVE_SCREENSHOT,
          data: {
            url: "foo.com",
            imageURI: FAKE_THUMBNAILS.imageURI,
            imageURI_2x: FAKE_THUMBNAILS.imageURI_2x
          }
        }
      ];
      const state = {Sites: {}};
      const store = mockStore(state, expectedActions, done);
      store.dispatch(SitesActions.getSiteThumbnail("foo.com"));
    });
  });

  describe("#getSuggestedDirectory", () => {
    // TODO
  });

  describe("#getFrecentSites", () => {
    it("should dispatch the right actions", done => {
      FAKE_FRECENT.type = c.RECEIVE_FRECENT;
      const expectedActions = [
        {type: c.REQUEST_FRECENT},
        {type: c.REQUEST_SCREENSHOT},
        {type: c.REQUEST_SCREENSHOT},
        {type: c.REQUEST_SCREENSHOT},
        {type: c.REQUEST_SCREENSHOT},
        {type: c.RECEIVE_FRECENT, data: {sites: FAKE_FRECENT}},
      ];
      const state = {Sites: {}};
      const store = mockStore(state, expectedActions, done);
      store.dispatch(SitesActions.getFrecentSites());
    });
  });

  describe("#updateSites", () => {
    it("should create a RECEIVE_UPDATE_SITES action", () => {
      assert.deepEqual(SitesActions.updateSites(), {
        type: c.RECEIVE_UPDATE_SITES, data: {}
      });
    });
  });
});
