/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*globals async, caches, fetch, Response, Request*/
/*exported CacheTasks */

"use strict";

/**
 * Collection of common task performed by a Service Worker cache.
 */
const CacheTasks = {
  /**
   * Populates the a cache with a list of requests.
   *
   * @param {String} cacheName The name of the cache.
   * @param {Array} requests The requests (URLs or Requests) to cache.
   */
  populateCache: async(function* (cacheName, requests) {
    var cache = yield caches.open(cacheName);
    var success = true;
    try {
      yield cache.addAll(requests);
    } catch (err) {
      var msg = `Error adding resources to cache ${cacheName}.`;
      console.warn(msg, err);
      success = false;
    }
    return success;
  }),
  /**
   * Saves a binary file into a cache.
   *
   * @param {String} cacheName The name of the cache to save into.
   * @param {ArrayBuffer} arrayBuffer The arrayBuffer holding the file's data.
   * @param {String} type MimeType of the data being stored.
   * @param {String|URL} requestURL The URL this request maps to.
   */
  saveBinaryToCache: async(function* (cacheName, arrayBuffer, type, requestURL) {
    var cache = yield caches.open(cacheName);
    var dataView = new DataView(arrayBuffer);
    var blob = new Blob([dataView], {
      type
    });
    var responseInit = {
      headers: {
        "Content-Type": type
      }
    };
    var request = new Request(requestURL);
    var response = new Response(blob, responseInit);
    var success = true;
    try {
      yield cache.put(request, response);
    } catch (err) {
      var msg = `Error putting blob in cache ${cacheName} for ${requestURL}.`;
      console.warn(msg, err);
      success = false;
    }
    return success;
  }),

  /**
   * Respond to a request from the SW's caches.
   *
   * @param {Request|String} request The request
   * @optional {String} cacheName The name of the cache to look in.
   * @optional {String} strategy  The strategy to use when the response
   *                              is not found. "throw" causes this to throw
   *                              otherwise, it passes the request to the
   *                              network via fetch.
   */
  respondFromCache: async(function* (request, cacheName, strategy = "") {
    var options = {};
    if (cacheName) {
      options.cacheName = cacheName;
    }
    var response = yield caches.match(request, options);
    switch (strategy) {
    case "throw":
      if (!response) {
        var msg = `Not found in cache: ${request.url || request}`;
        throw new Error(msg);
      }
      break;
      //Default passes the request to network using fetch()
    default:
      if (!response) {
        response = yield fetch(request);
      }
      break;
    }
    return response;
  }),
  /**
   * Checks if there is a cache entry for a particular request.
   * @param {Request|String} request The request to check for.
   * @optional {String} cacheName The cache's name to look in.
   */
  hasCacheEntry: async(function* (request, cacheName) {
    // TODO: marcosc - fix this to use caches.matches()!
    var cache = yield caches.open(cacheName);
    var response = yield cache.match(request)
    if (response) {
      return true;
    }
    return false;
  }),
  /**
   * Delete all the SW's caches.
   */
  clearAllCaches: async(function* () {
    var keys = yield caches.keys();
    for (var name of keys) {
      caches.delete(name);
    }
  }),
};
