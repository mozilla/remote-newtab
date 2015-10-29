/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint browser:true, worker:true*/
/*globals async, Request, caches, fetch, RequestUtils, ResponseUtils, self*/
/*exported CacheTasks */
"use strict";
(function(exports, ResponseUtils, RequestUtils) {
  /**
   * Collection of common task performed by a Service Worker cache.
   */
  const MemoizedCaches = {
    openedCaches: new Map(),
    open(cacheName) {
      return async.task(function*() {
        if (this.openedCaches.has(cacheName)) {
          return this.openedCaches.get(cacheName);
        }
        var cache = yield caches.open(cacheName);
        this.openedCaches.set(cacheName, cache);
        return cache;
      }, this);
    },
    delete(cacheName) {
      this.openedCaches.delete(cacheName);
    }
  };

  const CacheTasks = {
    /**
     * Populates the a cache with a list of requests.
     *
     * @param {Array} requests The requests (URLs or Requests) to cache.
     * @param {String} cacheName The name of the cache.
     */
    populateCache(requests, cacheName) {
      return async.task(function*() {
        var cache = yield MemoizedCaches.open(cacheName);
        var success = true;
        try {
          yield cache.addAll(requests);
        } catch (err) {
          var msg = `Error adding resources to cache ${cacheName}.`;
          console.warn(msg, err);
          success = false;
        }
        return success;
      }, this);
    },
    /**
     * Respond to a request from the SW's caches.
     *
     * @param {Request|String} request The request
     * @param {String} [cacheName] The name of the cache to look in.
     */
    respondFromCache(request, cacheName) {
      return async.task(function*() {
        var cache = yield MemoizedCaches.open(cacheName);
        var response = yield cache.match(request);
        if (!response) {
          var msg = `Request ${request.url || request} not in cache ${cacheName}.`;
          throw new Error(msg);
        }
        return response;
      }, this);
    },
    /**
     * Checks if there is a cache entry for a particular request.
     *
     * @param {Request|String} request The request to check for.
     * @param {String} [cacheName] The cache's name to look in.
     * @return {Boolean} True if it has the request, false otherwise.
     */
    hasCacheEntry(request, cacheName) {
      return async.task(function*() {
        var cache = yield MemoizedCaches.open(cacheName);
        var response = yield cache.match(request);
        return (response) ? true : false;
      }, this);
    },
    /**
     * If a cache entry is stale, it refreshes the cache entry from the network.
     * It uses HTTP cache directives to determine if the response is stale.
     *
     * @param  {Request} request  The request to refresh.
     * @param  {String} cacheName The cache that should contain the request.
     * @param  {String} force     Force a refresh (use "force")
     * @return {Promise<response>} Resolves with the potentially refreshed response.
     */
    refreshCacheEntry(request, cacheName, force = "") {
      return async.task(function*() {
        var hasEntry = yield this.hasCacheEntry(request, cacheName);
        if (!hasEntry) {
          var msg = `Request ${request.url || request} not in cache ${cacheName}.`;
          throw new Error(msg);
        }
        var cache = yield MemoizedCaches.open(cacheName);
        var response = yield cache.match(request);
        // If it's not stale and we are not forced to refresh
        if (!force && !ResponseUtils.isStale(response)) {
          return response;
        }
        // if onLine and either it's stale or being forced
        if (navigator.onLine && (ResponseUtils.isStale(response) || force)) {
          try {
            response = yield fetch(request);
          } catch (err) {
            console.warn("Fetch failed. Maybe off-line?", err);
            // return stale response
            return response;
          }
          yield this.putCacheEntry(request, response, cacheName);
        }
        return response;
      }, this);
    },
    /**
     * Adds a cache request/response pair to a particular cache.
     *
     * @param  {Request} request The request to store.
     * @param  {Response} response The response to store.
     * @param  {String} cacheName The cache to try to save into.
     * @return {Promise<Boolean>} True if success, false otherwise.
     */
    putCacheEntry(request, response, cacheName) {
      return async.task(function*() {
        var isReqCacheable = true;
        if (request instanceof Request) {
          isReqCacheable = RequestUtils.isCacheable(request);
        }
        var isRespCachable = ResponseUtils.isCacheable(response);
        if (!isRespCachable || !isReqCacheable) {
          console.warn(`Caching ${request.url || request} was forbidden.`);
          return false;
        }
        var cache = yield MemoizedCaches.open(cacheName);
        yield cache.put(request, response.clone());
        return true;
      }, this);
    },
    /**
     * Deletes a cache entry.
     *
     * @param {Request|String} request The request to delete.
     * @param {String} cacheName The cache name from where to delete.
     * @returns {Boolean}
     */
    deleteCacheEntry(request, cacheName, options = {}) {
      return async.task(function*() {
        var cache = yield MemoizedCaches.open(cacheName);
        return yield cache.delete(request, options);
      }, this);
    },
    /**
     * Delete all the SW's caches.
     *
     * @returns {Map<String,Boolean>} A map representing the keys and the result
     *                                of deleting the cache.
     */
    deleteAllCaches() {
      return async.task(function*() {
        var keys = yield caches.keys();
        var promisesToDelete = keys.map(
          key => caches.delete(key)
        );
        var results = yield Promise.all(promisesToDelete);
        var keyResult = new Map();
        keys.forEach((key, index) => {
          if (results[index]) {
            MemoizedCaches.delete(key);
          }
          keyResult.set(key, results[index]);
        });
        return keyResult;
      }, this);
    },
  };
  exports.CacheTasks = CacheTasks;
}(self || window, ResponseUtils, RequestUtils));
