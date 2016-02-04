const {error} = require("lib/log");

const userDatabase = {
  _database: null,

  init(keys = {"blockedLinks": []}, db = window.indexedDB) {
    this._keys = keys;
    return new Promise((resolve, reject) => {
      const request = db.open("NewTabData", 1);

      request.onerror = event => {
        const errorString = event.target.errorCode + ": Cannot open an indexedDB connection";
        reject(new Error(errorString));
      };
      request.onsuccess = event => {
        // Save the database connection.
        userDatabase._database = event.target.result;
        resolve();
      };
      request.onupgradeneeded = event => {
        // Note: After a successful upgrade, onsuccess will be triggered.
        userDatabase._onDatabaseUpgrade(event);
      };
    });
  },

  save(objectStoreToWrite, objectStoreType, data, mockObjectStore) {
    return new Promise((resolve, reject) => {
      const transaction = userDatabase._database.transaction([objectStoreToWrite], "readwrite");
      const objectStore = mockObjectStore || transaction.objectStore(objectStoreToWrite);

      const request = objectStore.get(objectStoreType);
      request.onsuccess = () => {
        userDatabase._onWriteFetchRequestSuccess(request, data, objectStore, objectStoreType).then(resolve, reject);
      };
      request.onerror = event => {
        const errorString = `${event.target.errorCode}: Failed to store object of type ${objectStoreType}`;
        error(errorString);
        reject(new Error(errorString));
      };
    });
  },

  load(objectStoreToRead, objectStoreType) {
    const transaction = userDatabase._database.transaction([objectStoreToRead]);
    const objectStore = transaction.objectStore(objectStoreToRead);
    const request = objectStore.get(objectStoreType);
    const transactionDescription = "Load data " + objectStoreType;
    return userDatabase._setSimpleRequestHandlers(request, transactionDescription);
  },

  _setSimpleRequestHandlers(request, errorString) {
    return new Promise((resolve, reject) => {
      request.onerror = event => {
        error(errorString);
        reject(new Error(errorString));
      };
      request.onsuccess = event => {
        const data = event.target.result.data;
        let result;
        if (data && typeof data !== "string") {
          result = JSON.stringify(data);
        } else {
          // null, undefined, empty string
          result = data;
        }
        resolve(result);
      };
    });
  },

  _createPrefsData(dataType, data) {
    const prefsData = {};
    prefsData.prefType = dataType;
    prefsData.data = data;
    return prefsData;
  },

  _onWriteFetchRequestSuccess(request, dataToWrite, objectStore, objectStoreType) {
    const result = request.result;
    result.data = dataToWrite;
    const requestUpdate = objectStore.put(result);
    const transactionDescription = "Update data " + objectStoreType;
    return this._setSimpleRequestHandlers(requestUpdate, transactionDescription);
  },

  _onDatabaseUpgrade(event) {
    // For version 1, we start with an empty list for each key.
    // (Migration of existing prefs in another bug).
    const db = event.target.result;
    const objStore = db.createObjectStore("prefs", {keyPath: "prefType"});

    objStore.transaction.oncomplete = () => {
      const prefObjectStore = db.transaction("prefs", "readwrite").objectStore("prefs");
      Object.keys(this._keys).forEach(key => {
        prefObjectStore.add(userDatabase._createPrefsData(key, this._keys[key]));
      });
    };
  },

  close() {
    this._database.close();
  }
};
module.exports = userDatabase;
