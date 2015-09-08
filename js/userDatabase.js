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

    init(callback) {
      return new Promise((resolve, reject) => {
        let request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onerror = event => {
          gUserDatabase._logError(event, OPEN_DATABASE_TRANSACTION_STRING, reject);
        };
        request.onsuccess = event => {
          gUserDatabase._onDatabaseOpenSuccess(event, resolve, callback);
        };
        request.onupgradeneeded = event => {
          gUserDatabase._onDatabaseUpgrade(event);
        };
      });
    },

    save(objectStoreToWrite, objectStoreType, data) {
      let transaction = gUserDatabase._database.transaction([objectStoreToWrite], READ_WRITE_TRANSACTION_STRING);
      let objectStore = transaction.objectStore(objectStoreToWrite);

      let request = objectStore.get(objectStoreType);
      request.onsuccess = () => {
        gUserDatabase._onWriteFetchRequestSuccess(request, data, objectStore, objectStoreType);
      };
      request.onerror = event => {
        gUserDatabase._logError(event, LOAD_DATA_TRANSACTION_STRING + objectStoreType);
      };
    },

    load(objectStoreToRead, objectStoreType) {
      return new Promise((resolve, reject) => {
        let transaction = gUserDatabase._database.transaction([objectStoreToRead]);
        let objectStore = transaction.objectStore(objectStoreToRead);
        let request = objectStore.get(objectStoreType);
        let transactionDescription = LOAD_DATA_TRANSACTION_STRING + objectStoreType;
        gUserDatabase._setSimpleRequestHandlers(request, transactionDescription, resolve, reject);
      });
    },

    _logSuccess(event, transactionDescription, resolve) {
      let success = "Success: " + transactionDescription;
      console.log(success);
      if (resolve) {
        resolve(event.target.result.data);
      }
    },

    _logError(event, errorString, reject) {
      let error = "Error: " + event.target.errorCode + ": " + errorString;
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
      let prefsData = {};
      prefsData[OBJECT_STORE_PREFS_KEY] = dataType;
      prefsData[OBJECT_STORE_PREFS_VALUE] = data;
      return prefsData;
    },

    _onWriteFetchRequestSuccess(request, dataToWrite, objectStore, objectStoreType) {
      let result = request.result;
      result.data = dataToWrite;
      let requestUpdate = objectStore.put(result);
      let transactionDescription = UPDATE_DATA_TRANSACTION_STRING + objectStoreType;
      gUserDatabase._setSimpleRequestHandlers(requestUpdate, transactionDescription);
    },

    _onDatabaseOpenSuccess(event, resolve, callback) {
      // Save the database connection and pass back the existing pinned links.
      gUserDatabase._database = event.target.result;
      gUserDatabase.load(OBJECT_STORE_PREFS, PINNED_LINKS_PREF).then((pinnedLinks) => {
        callback(pinnedLinks);
        resolve();
      });
    },

    _onDatabaseUpgrade(event) {
      // For version 1, we start with an empty list of pinned links.
      // (Migration of existing pinned links & other prefs in another bug).
      let db = event.target.result;
      let objStore = db.createObjectStore(OBJECT_STORE_PREFS, {keyPath: OBJECT_STORE_PREFS_KEY});

      objStore.transaction.oncomplete = () => {
        let prefObjectStore = db.transaction(OBJECT_STORE_PREFS,
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
