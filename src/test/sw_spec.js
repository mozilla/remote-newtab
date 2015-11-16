/* jshint esnext: true, expr: true */
/* globals expect, async, it*/
"use strict";
describe("Service worker registration", function() {
  it("should correctly register and activate the Service Worker.", async(function*() {
    // force reload on first load.
    var registration = yield navigator.serviceWorker.register("sw.js");
    var sw = (yield navigator.serviceWorker.ready).active;
    expect(sw).to.be.ok;
    yield registration.unregister();
  }));
});
