/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

(function(exports) {
  const gUserDatabase = {
    _database: null,

    init(callback) {
      return new Promise((resolve, reject) => {
        //window.indexedDB.deleteDatabase("NewTabData");
        let request = window.indexedDB.open("NewTabData", 1);

        request.onerror = function(event) {
          reject(event.target.errorCode);
        };
        request.onsuccess = function(event) {
          gUserDatabase._database = event.target.result;
          gUserDatabase.load("prefs", "pinnedLinks").then((pinnedLinks) => {
            callback(pinnedLinks);
            resolve();
          });
        };
        request.onupgradeneeded = function(event) {
          let db = event.target.result;
          let objStore = db.createObjectStore("prefs", { keyPath : "objectStoreType" });

          objStore.transaction.oncomplete = function(event) {
            // Store values in the newly created objectStore.
            let prefObjectStore = db.transaction("prefs", "readwrite").objectStore("prefs");
            prefObjectStore.add({"objectStoreType": "pinnedLinks", "data": []});
          }
        };
      });
    },

    save(objectStoreToWrite, objectStoreType, data) {
      let transaction = gUserDatabase._database.transaction([objectStoreToWrite], "readwrite");
      let objectStore = transaction.objectStore(objectStoreToWrite);

      let request = objectStore.get(objectStoreType);
      //let request = objectStore.add({objectStoreType, data});
      request.onsuccess = function(event) {
        let result = request.result;
        result.data = data;
        let requestUpdate = objectStore.put(result);
        requestUpdate.onerror = function(event) {
          // Do something with the error
          console.log("error wtf " + event.target.errorCode);
        };
        requestUpdate.onsuccess = function(event) {
          console.log("SUCCESS OF SAVE " + result.data);
        };
      };
    },

    load(objectStoreToRead, objectStoreType) {
      return new Promise((resolve, reject) => {
        let transaction = gUserDatabase._database.transaction([objectStoreToRead]);
        let objectStore = transaction.objectStore(objectStoreToRead);
        let request = objectStore.get(objectStoreType);
        request.onerror = function(event) {
          reject();
        };
        request.onsuccess = function(event) {
          resolve(event.target.result.data);
        };
      });
    },

    close() {
      this._database.close();
    }
  }
  exports.gUserDatabase = gUserDatabase;
}(window));