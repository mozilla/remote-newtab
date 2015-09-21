/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

(function(exports) {
  const gUserDatabase = {
    _database: null,

    init(db =  window.indexedDB) {
      return new Promise((resolve, reject) => {
        var request = db.open("NewTabData", 1);

        request.onerror = event => {
          var errorString = event.target.errorCode + ": Cannot open an indexedDB connection";
          console.error(errorString);
          reject(new Error(errorString));
        };
        request.onsuccess = event => {
          // Save the database connection.
          gUserDatabase._database = event.target.result;
          resolve();
        };
        request.onupgradeneeded = event => {
          // Note: After a successful upgrade, onsuccess will be triggered.
          gUserDatabase._onDatabaseUpgrade(event);
        };
      });
    },

    save(objectStoreToWrite, objectStoreType, data, mockObjectStore) {
      return new Promise((resolve, reject) => {
        var transaction = gUserDatabase._database.transaction([objectStoreToWrite], "readwrite");
        var objectStore = mockObjectStore || transaction.objectStore(objectStoreToWrite);

        var request = objectStore.get(objectStoreType);
        request.onsuccess = () => {
          gUserDatabase._onWriteFetchRequestSuccess(request, data, objectStore, objectStoreType).then(resolve, reject);
        };
        request.onerror = event => {
          var errorString = event.target.errorCode + ": Failed to store object of type " + objectStoreType;
          console.error(errorString);
          reject(new Error(errorString));
        };
      });
    },

    load(objectStoreToRead, objectStoreType) {
      var transaction = gUserDatabase._database.transaction([objectStoreToRead]);
      var objectStore = transaction.objectStore(objectStoreToRead);
      var request = objectStore.get(objectStoreType);
      var transactionDescription = "Load data " + objectStoreType;
      return gUserDatabase._setSimpleRequestHandlers(request, transactionDescription);
    },

    _setSimpleRequestHandlers(request, logString) {
      return new Promise((resolve, reject) => {
        request.onerror = event => {
          var errorString = event.target.errorCode + ": " + logString;
          console.error(errorString);
          reject(new Error(errorString));
        };
        request.onsuccess = event => {
          resolve(event.target.result.data);
        };
      });
    },

    _createPrefsData(dataType, data) {
      var prefsData = {};
      prefsData.prefType = dataType;
      prefsData.data = data;
      return prefsData;
    },

    _onWriteFetchRequestSuccess(request, dataToWrite, objectStore, objectStoreType) {
      var result = request.result;
      result.data = dataToWrite;
      var requestUpdate = objectStore.put(result);
      var transactionDescription = "Update data " + objectStoreType;
      return this._setSimpleRequestHandlers(requestUpdate, transactionDescription);
    },

    _onDatabaseUpgrade(event) {
      // For version 1, we start with an empty list of pinned links.
      // (Migration of existing pinned links & other prefs in another bug).
      var db = event.target.result;
      var objStore = db.createObjectStore("prefs", {keyPath: "prefType"});

      objStore.transaction.oncomplete = () => {
        var prefObjectStore = db.transaction("prefs", "readwrite").objectStore("prefs");
        prefObjectStore.add(gUserDatabase._createPrefsData("pinnedLinks", []));
      };
    },

    close() {
      this._database.close();
    }
  };
  exports.gUserDatabase = gUserDatabase;
}(window));
