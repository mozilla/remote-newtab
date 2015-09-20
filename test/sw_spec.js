/* jshint esnext: true, expr: true */
/* globals expect, async, xit*/
"use strict";
describe("Service worker", function() {
  it("should be registered and active", async(function* () {
    // force reload on first load.
    var swContainer = navigator.serviceWorker;
    swContainer.register("sw.js", {scope: "./"});
    var sw = (yield swContainer.ready).active;
    expect(sw).to.be.ok;
    var ThumbMaker = swThumbMaker(sw);
    var thumbsMap = makeThumbs(ThumbMaker);
    describe("Service worker", function() {
      var isTrue = value => value === true;
      var isFalse = value => value === false;

      it("should not have entries in pagethumb cache.", async(function* () {
        var promises = Array.from(thumbsMap.values()).map(callExists);
        var results = yield Promise.all(promises);
        expect(results.every(isFalse)).to.be.true;
      }));

      it("should store thumbs in the cache.", async(function* () {
        var promises = Array.from(thumbsMap.values()).map(callSave);
        var results = yield Promise.all(promises);
        expect(results.every(isTrue)).to.be.true;
      }));

      it("should now have entries in pagethumb cache.", async(function* () {
        var promises = Array.from(thumbsMap.values()).map(callExists);
        var results = yield Promise.all(promises);
        expect(results.every(isTrue)).to.be.true;
      }));

      // Attempting to load images fails after install fails.
      xit("should respond with the correct image.", async(function* () {
        var promises = Array.from(thumbsMap.values()).map(callLoad);
        var results = yield Promise.all(promises);
        expect(results.every(isTrue)).to.be.true;
      }));

      it("should allow deleting entries.", async(function* () {
        var promises = Array.from(thumbsMap.values()).map(callDelete);
        var results = yield Promise.all(promises);
        expect(results.every(isTrue)).to.be.true;
      }));

      it("should not contain thumbs previously deleted from the cache.", async(function* () {
        var promises = Array.from(thumbsMap.values()).map(callExists);
        var results = yield Promise.all(promises);
        expect(results.every(isFalse)).to.be.true;
      }));

      // Images still show up even after expired from cache.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1206298
      xit("should not serve thumbs that were removed from cache.", async(function* () {
        var promises = Array.from(thumbsMap.values()).map(callLoad);
        var results = yield Promise.all(promises);
        expect(results.every(isFalse)).to.be.true;
      }));

      it("should not serve thumbs that it never had.", async(function* () {
        var noExistThumb = new ThumbMaker("/pagethumbs/never-saved.com", "no-such-data");
        var result = yield noExistThumb.load();
        expect(result).to.be.false;
      }));

      it("should delete all caches.", async(function* () {
        var cacheDelete = clearAllCaches(sw);
        var result = yield cacheDelete();
        expect(result).to.be.true;
      }));

    });
  }));

  var idGenerator = function* (name) {
    var count = 0;
    while (true) {
      var id = `${name}_${count++}`;
      yield id;
    }
  };
  var callExists = callMethod("exists");
  var callSave = callMethod("save");
  var callDelete = callMethod("delete");
  var callLoad = callMethod("load");

  function makeThumbs(ThumbMaker) {
    var yellowPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4/5/hPwAH/QL+ecrXpAAAAABJRU5ErkJggg==";
    var redPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4z8DwHwAFAAH/VscvDQAAAABJRU5ErkJggg==";
    var thumbsMap = new Map();
    var rawThumbs = [
      ["foo", yellowPng],
      ["bar", redPng],
      ["baz", yellowPng]
    ];
    rawThumbs.forEach(([name, rawData]) => {
      thumbsMap.set(name, new ThumbMaker(`/pagethumbs/${name}.com`, rawData));
    });
    return thumbsMap;
  }

  function callMethod(methodName) {
    return function(obj) {
      return obj[methodName]();
    };
  }

  function swThumbMaker(sw) {
    var isThumbInCache = thumbCacheHasUrl(sw);
    var saveInThumbCache = storeThumb(sw);
    var deleteFromCache = deleteThumbFromCache(sw);
    var pngBufferMaker = toArrayBuffer();
    return function PageThumb(thumbURL, rawImgData) {
      var imgBufferPromise = pngBufferMaker(rawImgData);
      var canLoadSelf = canLoadImg(thumbURL);
      this.exists = () => isThumbInCache(thumbURL);
      this.delete = () => deleteFromCache(thumbURL);
      this.save = async(function* () {
        var imgBuffer = yield imgBufferPromise;
        var result = yield saveInThumbCache(imgBuffer, thumbURL);
        return result;
      });
      this.load = canLoadSelf;
    };
  }

  function clearAllCaches(sw) {
    const awaitCacheClears = swMessage(sw, "clearAllCaches");
    return async(function* () {
      const msgData = {};
      const result = yield awaitCacheClears(msgData);
      return result;
    });
  }

  function storeThumb(sw) {
    const awaitPutMessage = swMessage(sw, "NewTab:PutSiteThumb");
    return async(function* (arrayBuffer, thumbPath) {
      const msgData = {
        thumbPath,
        arrayBuffer,
        type: "image/png"
      };
      const result = yield awaitPutMessage(msgData);
      return result;
    });
  }

  function swMessage(sw, name) {
    const idGen = idGenerator(name);
    return async(function* (data) {
      const swContainer = navigator.serviceWorker;
      const msgId = idGen.next().value;
      var msgData = Object.assign({
        id: msgId,
        name
      }, data);
      var transferable = (msgData.arrayBuffer) ? msgData.arrayBuffer : undefined;
      if (transferable) {
        sw.postMessage(msgData, [transferable]);
      } else {
        sw.postMessage(msgData);
      }
      const result = yield new Promise((res) => {
        swContainer.addEventListener("message", function handler({data}) {
          if (data.id !== msgId) {
            return;
          }
          swContainer.removeEventListener("message", handler);
          res(data.result);
        });
      });
      return result;
    });
  }

  function toArrayBuffer(type = "image/png") {
    return async(function* (encodedString) {
      //1x1 png yellow pixel
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
        fileReader.onerror = function() {
          reject(new Error("Could not create ArrayBuffer."));
        };
        fileReader.readAsArrayBuffer(blob);
      });
      return arrayBuffer;
    });
  }

  function deleteThumbFromCache(sw) {
    const awaitThumbMessage = swMessage(sw, "NewTab:DeleteSiteThumb");
    return async(function* (thumbURL) {
      var result = yield awaitThumbMessage({
        thumbURL
      });
      return result;
    });
  }

  function thumbCacheHasUrl(sw) {
    const awaitThumbMessage = swMessage(sw, "NewTab:HasSiteThumb");
    return async(function* (thumbURL) {
      return (yield awaitThumbMessage({
        thumbURL
      }));
    });
  }

  function canLoadImg(src) {
    return async(function* () {
      var result = yield new Promise((res) => {
        var img = new Image();
        img.src = src;
        img.alt = src;
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

      });
      return result;
    });
  }
});
