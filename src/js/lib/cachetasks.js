/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*jshint browser:true, worker:true*/
/*globals async, Request, Response, caches, fetch*/
/*exported CacheTasks */
"use strict";
(function(exports) {
  /**
   * Memoized opened caches for efficiency.
   *
   * @private
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
  /**
   * Helper object for working with Requests.
   *
   * @private
   */
  const RequestUtils = {
    /**
     * Simple implementation of RFC7234 (HTTP1.1 Bis), "Storing Responses in
     * Caches": rules that determine if a request can be cached.
     *
     * This method does not validate the header values.
     *
     * @see http://tools.ietf.org/html/rfc7234#section-3
     * @param  {Request} request The request to check.
     * @return {Boolean} True if is can be cached, false otherwise.
     */
    isCacheable(request) {
      var headers = request.headers;
      // Explicitly told not to store it
      var cacheDirectives = parseDirectives(headers.get("Cache-Control"));
      if (cacheDirectives.has("no-store")) {
        return false;
      }
      return true;
    },
  };
  /**
   * Helper object for working with Responses
   *
   * @private
   */
  const ResponseUtils = {
    /**
     * Non-validating implementation of RFC7234 (HTTP1.1 Bis), "Storing
     * Responses in Caches": rules that determine if a response can be cached.
     *
     * This method does not validate the header values.
     *
     * @see http://tools.ietf.org/html/rfc7234#section-3
     * @param {Response} response The operation to check.
     * @return {Boolean} True if is can be cached, false otherwise.
     */
    isCacheable(response) {
      var headers = response.headers;
      // No cache control, so can be cached.
      if (!headers.has("Cache-Control")) {
        return true;
      }
      var cacheDirectives = parseDirectives(headers.get("Cache-Control"));
      if (cacheDirectives.has("no-store")) {
        return false;
      }
      return headers.has("Expires") || cacheDirectives.has("max-age");
    },
    /**
     * Determines if a response is stale by checking if it has expired
     * or its max-age has passed.
     *
     * @param  {Response}  response the response to check.
     * @return {Boolean} True if it is stale, false otherwise.
     * @throws {TypeError} If invalid input type.
     */
    isStale(response) {
      if (!(response instanceof Response)) {
        throw new TypeError("Invalid input.");
      }
      var headers = response.headers;
      if (headers.has("Expires")) {
        return this.isExpired(response);
      }
      if (headers.has("Cache-Control")) {
        return this.hasMaxAgeLapsed(response);
      }
      return false;
    },
    /**
     * Check if the max-age of the response has lapsed.
     *
     * @param  {Response}  response the response to check.
     * @return {Boolean} True if has, false otherwise.
     */
    hasMaxAgeLapsed(response) {
      var headers = response.headers;
      var now = new Date(Date.now()).toGMTString();
      var cacheDirectives = parseDirectives(headers.get("Cache-Control"));
      // max-age is in seconds, so convert to millis to compare to date
      var parsedMaxAge = parseInt(cacheDirectives.get("max-age")) * 1000;
      var parsedDate = Date.parse(headers.get("Date"));
      if (Number.isNaN(parsedMaxAge) || Number.isNaN(parsedDate)) {
        throw new Error("Invalid header value.");
      }
      // Low precision comparison, to the second.
      return Date.parse(now) > (parsedDate + parsedMaxAge);
    },
    /**
     * Check if a response has expired.
     *
     * @param  {Response} response The response to check.
     * @return {Boolean} True if has expired, false otherwise.
     */
    isExpired(response) {
      var headers = response.headers;
      var now = new Date(Date.now()).toGMTString();
      var expires = Date.parse(headers.get("Expires"));
      if (Number.isNaN(expires)) {
        throw new TypeError("Invalid date in Expires header.");
      }
      // Low precision comparison, to the second.
      return Date.parse(now) > expires;
    },
  };
  /**
   * Helper function converts simple HTTP cache directives to a map.
   *
   * @param  {Header} header The header object.
   * @return {Map} The map of directives.
   */
  function parseDirectives(header) {
    var directives = new Map();
    if (!header) {
      return directives;
    }
    header.split(",")
      .map(directive => directive.trim())
      .map(directive => directive.split("="))
      .forEach(([key, value]) => directives.set(key, value));
    return directives;
  }
  /**
   * A collection of common task performed by a Caches API.
   */
  const CacheTasks = {
    /**
     * Check if a response is stale, based on its cache directives.
     *
     * @param  {Response}  response The response to check.
     * @return {Boolean} True is stale, false otherwise.
     * @throws {TypeError} If argument is not a Response object.
     */
    isStale(response) {
      return ResponseUtils.isStale(response);
    },
    /**
     * Populates the a cache with a list of requests.
     *
     * @param {Array<Request|String>} requests The requests to cache.
     * @param {String} cacheName The name of the cache.
     * @return {Boolean} returns true if the operation finished successfully,
     *                           false otherwise.
     */
    addAll(requests, cacheName) {
      return async.task(function*() {
        var cache = yield MemoizedCaches.open(cacheName);
        try {
          yield cache.addAll(requests);
        } catch (err) {
          var msg = `Error adding resources to cache ${cacheName}.`;
          console.warn(msg, err);
          return false;
        }
        return true;
      }, this);
    },
    /**
     * Update the response associated with a request.
     *
     * @param  {Request} request   The request to check.
     * @param  {String} cacheName The name of the cache to use.
     * @param  {Object} options    options
     *                              - force: true or false
     * @return {Promise} Resolves once operations complete.
     */
    update(request, cacheName, options = {force: false}) {
      return async.task(function*() {
        let cache = yield MemoizedCaches.open(cacheName);
        let response = yield cache.match(request);
        let shouldUpdate = !response || options.force || this.isStale(response);
        // We don't need to update, so just return what we have.
        if (!shouldUpdate) {
          return response;
        }
        // Let's try to update.
        try {
          let potentialResponse = yield fetch(request);
          // check that the fetching was "ok" (i.e., in the 200 range).
          if (potentialResponse.ok) {
            response = potentialResponse;
            yield this.put(request, response, cacheName);
          } else {
            let url = request.url || request;
            let status = potentialResponse.status;
            let msg = `Response not OK for: ${url} (Got back a ${status}).`;
            console.error(msg);
          }
        } catch (err) {
          // if we don't have a response at all, all we can do is throw.
          if (!response) {
            throw err;
          }
          let msg = `Exception when fetching: ${request.url || request}`;
          console.warn(msg);
          return response;
        }
        return response;
      }, this);
    },
    /**
     * Respond to a request from the SW's caches.
     *
     * @param {Request|String} request The request
     * @param {String} cacheName The name of the cache to look in.
     * @return {Promse<Response|undefined>} The matching response, or undefined.
     */
    match(request, cacheName) {
      return async.task(function*() {
        var cache = yield MemoizedCaches.open(cacheName);
        return yield cache.match(request);
      }, this);
    },
    /**
     * Check if a request has a corresponding entry in the cache.
     *
     * @param {Request|String} request The request to check for.
     * @param {String} [cacheName] The cache's name to look in.
     * @return {Promse<Boolean>} True if it has the request, false otherwise.
     */
    has(request, cacheName) {
      return async.task(function*() {
        var cache = yield MemoizedCaches.open(cacheName);
        var response = yield cache.match(request);
        return (response) ? true : false;
      }, this);
    },
    /**
     * Adds a cache request/response pair to a particular cache.
     *
     * @param  {Request|String} request The request to store.
     * @param  {Response} response The response to store.
     * @param  {String} cacheName The cache to try to save into.
     * @return {Promise<Boolean>} True if success, false otherwise.
     */
    put(request, response, cacheName) {
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
     * @param {Object} options Options are per the ServiceWorker spec.
     * @returns {Boolean}
     */
    delete(request, cacheName, options = {}) {
      return async.task(function*() {
        var cache = yield MemoizedCaches.open(cacheName);
        return yield cache.delete(request, options);
      }, this);
    },
    /**
     * Deletes either all the caches, or a specified list of them.
     *
     * @param {Strings[]} cacheNames The caches to delete, if omitted all
     *                               caches will be deleted.
     * @returns {Map<String,Boolean>} A map representing the keys and the result
     *                                of deleting the cache.
     */
    deleteCaches(cacheNames = []) {
      return async.task(function*() {
        var keys = (cacheNames.length) ? cacheNames : yield caches.keys();
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
}(self));
