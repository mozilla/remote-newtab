/* jshint esnext: true, expr: true */
/* globals expect, async, xit, swMessage*/
"use strict";
describe("Service worker registration", function() {
  it("should correctly register and activate the Service Worker.", async(function* () {
    // force reload on first load.
    navigator.serviceWorker.register("/base/src/v2/sw.js", {
      scope: "./"
    });
    var sw = (yield navigator.serviceWorker.ready).active;
    expect(sw).to.be.ok;
    var thumbs = makeThumbs(sw);
    describe("Service worker", function() {
      // Helper functions
      var isTrue = value => value === true;
      var isFalse = value => value === false;
      it("should not have entries in pagethumb cache.", async(function* () {
        var promises = thumbs.map(thumb => thumb.exists());
        var results = yield Promise.all(promises);
        expect(results.every(isFalse)).to.be.true;
      }));

      it("should store thumbs in the cache.", async(function* () {
        var promises = thumbs.map(thumb => thumb.save());
        var results = yield Promise.all(promises);
        expect(results.every(isTrue)).to.be.true;
      }));

      it("should now have entries in pagethumb cache.", async(function* () {
        var promises = thumbs.map(thumb => thumb.exists());
        var results = yield Promise.all(promises);
        expect(results.every(isTrue)).to.be.true;
      }));

      // Attempting to load images fails after install and active fails.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1206538
      xit("should respond with the correct image.", async(function* () {
        var promises = thumbs.map(thumb => thumb.load());
        var results = yield Promise.all(promises);
        expect(results.every(isTrue)).to.be.true;
      }));

      it("should allow deleting entries.", async(function* () {
        var promises = thumbs.map(thumb => thumb.delete());
        var results = yield Promise.all(promises);
        expect(results.every(isTrue)).to.be.true;
      }));

      it("should not contain thumbs previously deleted from the cache.", async(function* () {
        var promises = thumbs.map(thumb => thumb.exists());
        var results = yield Promise.all(promises);
        expect(results.every(isFalse)).to.be.true;
      }));

      // Images still show up even after expired from cache.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1206298
      xit("should not serve thumbs that were removed from cache.", async(function* () {
        var promises = thumbs.map(thumb => thumb.load());
        var results = yield Promise.all(promises);
        expect(results.every(isFalse)).to.be.true;
      }));

      it("should not serve thumbs that it never had.", async(function* () {
        var noExistThumb = new PageThumb(sw, "/pagethumbs/never-saved.com", "no-such-data");
        var result = yield noExistThumb.load();
        expect(result).to.be.false;
      }));

      it("should delete all caches.", async(function* () {
        var cacheDelete = deleteAllCaches(sw);
        var result = yield cacheDelete();
        expect(Array.from(result.values()).every(value => value)).to.be.true;
      }));

      it("should re-initialize site.", async(function* () {
        var siteInitializer = initializeSite(sw);
        var result = yield siteInitializer();
        expect(result).to.be.true;
      }));
    });
  }));

  function makeThumbs(sw) {
    var yellowPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4/5/hPwAH/QL+ecrXpAAAAABJRU5ErkJggg==";
    var redPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4z8DwHwAFAAH/VscvDQAAAABJRU5ErkJggg==";
    var rawThumbs = [
      ["foo", yellowPng],
      ["bar", redPng],
      ["baz", yellowPng],
    ];
    return rawThumbs.map(
      ([name, rawData]) => new PageThumb(sw, `/pagethumbs/${name}.com`, rawData)
    );
  }

  function PageThumb(sw, thumbURL, rawImgData) {
    var pngBufferMaker = toArrayBuffer();
    var promisedBuffer = pngBufferMaker(rawImgData);
    // Store private vars
    this.exists = async(function* () {
      var sendMessage = swMessage(sw, "NewTab:HasSiteThumb");
      var result = yield sendMessage({
        thumbURL
      });
      return result;
    }, this);
    this.delete = async(function* () {
      var sendMessage = swMessage(sw, "NewTab:DeleteSiteThumb");
      var result = yield sendMessage({
        thumbURL
      });
      return result;
    }, this);
    this.save = async(function* () {
      var arrayBuffer = yield promisedBuffer;
      var sendMessage = swMessage(sw, "NewTab:PutSiteThumb");
      var msgData = {
        thumbURL,
        arrayBuffer,
        type: "image/png",
      };
      var result = yield sendMessage(msgData, [arrayBuffer]);
      return result;
    }, this);
    this.load = async(function* () {
      var result = yield new Promise((res) => {
        var img = new Image();
        img.src = thumbURL;
        img.alt = thumbURL;
        img.onload = () => {
          res(true);
        };
        img.onerror = () => {
          res(false);
        };
        document.body.appendChild(img);
        img.width = "100";
        img.height = "100";
        img.style.border = "1px solid red";
        img.style.display = "inline-block";
      }, this);
      return result;
    });
  }

  function initializeSite(sw) {
    const sendMessage = swMessage(sw, "SW:InitializeSite");
    return async(function* () {
      const result = yield sendMessage();
      return result;
    });
  }

  function deleteAllCaches(sw) {
    const sendMessage = swMessage(sw, "SW:DeleteAllCaches");
    return async(function* () {
      const result = yield sendMessage();
      return result;
    });
  }

  function toArrayBuffer(type = "image/png") {
    return async(function* (encodedString) {
      var rawData = atob(encodedString);
      var intData = Array
        .from(rawData)
        .map(char => String.charCodeAt(char));
      var byteArray = new Uint8Array(intData);
      var blob = new Blob([byteArray], {
        type
      });
      var fileReader = new FileReader();
      var arrayBuffer = yield new Promise((resolve, reject) => {
        fileReader.onload = function() {
          resolve(this.result);
        };
        fileReader.onerror = () => {
          reject(new Error("Could not create ArrayBuffer."));
        };
        fileReader.readAsArrayBuffer(blob);
      });
      return arrayBuffer;
    });
  }
});
