/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const OBJECT_STORE_PREFS = "prefs";
const PINNED_LINKS_PREF = "pinnedLinks";

(function(exports) {
  const DATABASE_VERSION = 1;
  const DATABASE_NAME = "NewTabData";

  const OBJECT_STORE_PREFS_KEY = "prefType";
  const OBJECT_STORE_PREFS_VALUE = "data";

  const OPEN_DATABASE_TRANSACTION_STRING = "Open NewTabData connection";
  const LOAD_DATA_TRANSACTION_STRING = "Load data ";
  const UPDATE_DATA_TRANSACTION_STRING = "Update data ";
  const READ_WRITE_TRANSACTION_STRING = "readwrite";

  const gUserDatabase = {
    _database: null,

    init() {
      return new Promise((resolve, reject) => {
        var request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onerror = event => {
          gUserDatabase._logError(event, OPEN_DATABASE_TRANSACTION_STRING, reject);
        };
        request.onsuccess = event => {
          gUserDatabase._onDatabaseOpenSuccess(event, resolve);
        };
        request.onupgradeneeded = event => {
          gUserDatabase._onDatabaseUpgrade(event);
        };
      });
    },

    save(objectStoreToWrite, objectStoreType, data) {
      return new Promise((resolve, reject) => {
        var transaction = gUserDatabase._database.transaction([objectStoreToWrite], READ_WRITE_TRANSACTION_STRING);
        var objectStore = transaction.objectStore(objectStoreToWrite);

        var request = objectStore.get(objectStoreType);
        request.onsuccess = () => {
          gUserDatabase._onWriteFetchRequestSuccess(request, data, objectStore, objectStoreType, resolve, reject);
        };
        request.onerror = event => {
          gUserDatabase._logError(event, LOAD_DATA_TRANSACTION_STRING + objectStoreType, reject);
        };
      });
    },

    load(objectStoreToRead, objectStoreType) {
      return new Promise((resolve, reject) => {
        var transaction = gUserDatabase._database.transaction([objectStoreToRead]);
        var objectStore = transaction.objectStore(objectStoreToRead);
        var request = objectStore.get(objectStoreType);
        var transactionDescription = LOAD_DATA_TRANSACTION_STRING + objectStoreType;
        gUserDatabase._setSimpleRequestHandlers(request, transactionDescription, resolve, reject);
      });
    },

    _logSuccess(event, transactionDescription, resolve) {
      var success = "Success: " + transactionDescription;
      console.log(success);
      if (resolve) {
        resolve(event.target.result.data);
      }
    },

    _logError(event, errorString, reject) {
      var error = "Error: " + event.target.errorCode + ": " + errorString;
      console.log(error);
      if (reject) {
        reject(error);
      }
    },

    _setSimpleRequestHandlers(request, logString, resolve, reject) {
      request.onerror = (event) => {
        gUserDatabase._logError(event, logString, reject);
      };
      request.onsuccess = (event) => {
        gUserDatabase._logSuccess(event, logString, resolve);
      };
    },

    _createPrefsData(dataType, data) {
      var prefsData = {};
      prefsData[OBJECT_STORE_PREFS_KEY] = dataType;
      prefsData[OBJECT_STORE_PREFS_VALUE] = data;
      return prefsData;
    },

    _onWriteFetchRequestSuccess(request, dataToWrite, objectStore, objectStoreType, resolve, reject) {
      var result = request.result;
      result.data = dataToWrite;
      var requestUpdate = objectStore.put(result);
      var transactionDescription = UPDATE_DATA_TRANSACTION_STRING + objectStoreType;
      gUserDatabase._setSimpleRequestHandlers(requestUpdate, transactionDescription, resolve, reject);
    },

    _onDatabaseOpenSuccess(event, resolve) {
      // Save the database connection and pass back the existing pinned links.
      gUserDatabase._database = event.target.result;
      gUserDatabase.load(OBJECT_STORE_PREFS, PINNED_LINKS_PREF).then((pinnedLinks) => {
        resolve(pinnedLinks);
      });
    },

    _onDatabaseUpgrade(event) {
      // For version 1, we start with an empty list of pinned links.
      // (Migration of existing pinned links & other prefs in another bug).
      var db = event.target.result;
      var objStore = db.createObjectStore(OBJECT_STORE_PREFS, {keyPath: OBJECT_STORE_PREFS_KEY});

      objStore.transaction.oncomplete = () => {
        var prefObjectStore = db.transaction(OBJECT_STORE_PREFS,
          READ_WRITE_TRANSACTION_STRING).objectStore(OBJECT_STORE_PREFS);
        prefObjectStore.add(gUserDatabase._createPrefsData(PINNED_LINKS_PREF, []));
      };
    },

    close() {
      this._database.close();
    }
  };
  exports.gUserDatabase = gUserDatabase;
}(window));
