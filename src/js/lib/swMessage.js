/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals async*/
/*exports swMessage */
(function(exports) {
  "use strict";
  /**
   * swMessage provides a generalized way to send messages to a ServiceWorker.
   *
   * @param  {ServiceWorker} sw The service worker to communicate with.
   * @param  {String} name The name, or topic, of the message. Gets added to the
   *                       data of the message automatically.
   * @return {AsyncFunction} An async function that performs the communication.
   *
   * Supports sending an array buffer via data.arrayBuffer.
   *
   * Example of usage, in async function:
   *
   *  var hasSiteThumb = swMessage(sw, "NewTab:HasSiteThumb");
   *  var msgData = {thumbURL: "pagethumbs/foo/"};
   *  var result = yield hasSiteThumb(data);
   *  return result;
   */
  function swMessage(sw, name) {
    function* idGenerator(name) { // jshint ignore:line
      var count = 0;
      while (true) {
        var id = `${name}_${count++}`;
        yield id;
      }
    }
    const idGen = idGenerator(name);
    /**
     * The task that sends and receives a message from the SW.
     *
     * @param {Object=}   data The data to send to the SW.
     * @param {ArrayBuffer[]=} transferables ArrayBuffer to transfer ownership of to
     *                                  the the Service Worker in postMessage().
     */
    return async(function*(data = {}, transferables = []) {
      const msgId = idGen.next().value;
      const msgData = Object.assign({
        id: msgId,
        name,
      }, data);
      sw.postMessage(msgData, transferables);
      const result = yield new Promise((res) => {
        navigator.serviceWorker.addEventListener("message", function handler({data}) {
          if (data.id !== msgId) {
            return; // this message is not for me
          }
          navigator.serviceWorker.removeEventListener("message", handler);
          res(data.result);
        });
      });
      return result;
    });
  }
  exports.swMessage = swMessage;
}(window));
