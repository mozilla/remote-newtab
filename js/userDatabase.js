/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

(function(exports) {
  const DATABASE_VERSION = 1;
  const DATABASE_NAME = "NewTabData";

  const OBJECT_STORE_PREFS = "prefs";
  const PINNED_LINKS_PREF = "pinnedLinks";

  const gUserDatabase = {
    _database: null,

    init() {
      return new Promise((resolve, reject) => {
        var request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onerror = event => {
          gUserDatabase._logError(event, "Cannot open an indexedDB connection");
          reject(new Error(event.target.errorCode));
        };
        request.onsuccess = event => {
          gUserDatabase._onDatabaseOpenSuccess(event).then(pinnedLinks => {
            resolve(pinnedLinks);
          });
        };
        request.onupgradeneeded = event => {
          gUserDatabase._onDatabaseUpgrade(event);
        };
      });
    },

    save(objectStoreToWrite, objectStoreType, data) {
      return new Promise((resolve, reject) => {
        var transaction = gUserDatabase._database.transaction([objectStoreToWrite], "readwrite");
        var objectStore = transaction.objectStore(objectStoreToWrite);

        var request = objectStore.get(objectStoreType);
        request.onsuccess = () => {
          gUserDatabase._onWriteFetchRequestSuccess(request, data, objectStore, objectStoreType).then(resolve, reject);
        };
        request.onerror = event => {
          gUserDatabase._logError(event, `Failed to store object of type ${objectStoreType}`);
          reject(new Error(event.target.errorCode));
        };
      });
    },

    load(objectStoreToRead, objectStoreType) {
      return new Promise((resolve, reject) => {
        var transaction = gUserDatabase._database.transaction([objectStoreToRead]);
        var objectStore = transaction.objectStore(objectStoreToRead);
        var request = objectStore.get(objectStoreType);
        var transactionDescription = `Load data ${objectStoreType}`;
        gUserDatabase._setSimpleRequestHandlers(request, transactionDescription).then(resolve, reject);
      });
    },

    _logError(event, errorString) {
      var error = `Error: ${event.target.errorCode}: ${errorString}`;
      console.error(error);
    },

    _setSimpleRequestHandlers(request, logString) {
      return new Promise((resolve, reject) => {
        request.onerror = (event) => {
          gUserDatabase._logError(event, logString);
          reject(new Error(event.target.errorCode));
        };
        request.onsuccess = (event) => {
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
      var transactionDescription = `Update data ${objectStoreType}`;
      return gUserDatabase._setSimpleRequestHandlers(requestUpdate, transactionDescription);
    },

    _onDatabaseOpenSuccess(event) {
      // Save the database connection and pass back the existing pinned links.
      gUserDatabase._database = event.target.result;
      return gUserDatabase.load(OBJECT_STORE_PREFS, PINNED_LINKS_PREF);
    },

    _onDatabaseUpgrade(event) {
      // For version 1, we start with an empty list of pinned links.
      // (Migration of existing pinned links & other prefs in another bug).
      var db = event.target.result;
      var objStore = db.createObjectStore(OBJECT_STORE_PREFS, {keyPath: "prefType"});

      objStore.transaction.oncomplete = () => {
        var prefObjectStore = db.transaction(OBJECT_STORE_PREFS, "readwrite").objectStore(OBJECT_STORE_PREFS);
        prefObjectStore.add(gUserDatabase._createPrefsData(PINNED_LINKS_PREF, []));
      };
    },

    close() {
      this._database.close();
    }
  };
  exports.gUserDatabase = gUserDatabase;
  exports.OBJECT_STORE_PREFS = OBJECT_STORE_PREFS;
  exports.PINNED_LINKS_PREF = PINNED_LINKS_PREF;
}(window));
