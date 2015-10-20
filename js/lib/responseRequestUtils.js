/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*jshint browser:true, worker:true*/
/*global Response, Request*/
/*exported RequestUtils, ResponseUtils */
"use strict";
(function(exports) {

  // Helper object for working with Requests
  const RequestUtils = {
    /**
     * Simple implementation of RFC7234 (HTTP1.1 Bis), "Storing Responses in
     * Caches": rules that determine is a request can be cached.
     *
     * This method does not validate the header values.
     *
     * @see http://tools.ietf.org/html/rfc7234#section-3
     * @param  {Request} request The request to check.
     * @return {Boolean} True if is can be, false otherwise.
     */
    isCacheable(request) {
      if (!(request instanceof Request)) {
        throw new TypeError("Invalid input.");
      }
      var headers = request.headers;
      // Explicitly told not to store it
      var cacheDirectives = parseDirectives(headers.get("Cache-Control"));
      if (cacheDirectives.has("no-store")) {
        return false;
      }
      return true;
    },
  };
  exports.RequestUtils = RequestUtils;

  // Helper object for working with Responses
  const ResponseUtils = {
    /**
     * Simple implementation of RFC7234 (HTTP1.1 Bis), "Storing Responses in
     * Caches": rules that determine is a response can be cached.
     *
     * This method does not validate the header values.
     *
     * @see http://tools.ietf.org/html/rfc7234#section-3
     * @param {Response} response The operation to check.
     * @return {Boolean} True if is can be, false otherwise.
     */
    isCacheable(response) {
      if (!(response instanceof Response)) {
        throw new TypeError("Invalid input.");
      }
      var headers = response.headers;
      // No cache control, so can be cached.
      if (!headers.has("Cache-Control")) {
        return true;
      }
      var cacheDirectives = parseDirectives(headers.get("Cache-Control"));
      if (cacheDirectives.has("no-store")) {
        return false;
      }
      return cacheDirectives.has("max-age") || headers.has("Expires");
    },
    /**
     * Determines if a response is stale by checking if it has expired
     * or its max-age has passed.
     *
     * @param  {Response}  response the response to check.
     * @return {Boolean} True if has, false otherwise.
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
      if (!headers.has("Cache-Control")) {
        throw new Error("Missing Cache-Control header.");
      }
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
     * @return {Boolean} True if has, false otherwise.
     */
    isExpired(response) {
      var headers = response.headers;
      var now = new Date(Date.now()).toGMTString();
      if (!headers.has("Expires")) {
        throw new Error("Missing Expires header.");
      }
      var expires = Date.parse(headers.get("Expires"));
      if (Number.isNaN(expires)) {
        throw new TypeError("Invalid date in Expires header.");
      }
      // Low precision comparison, to the second.
      return Date.parse(now) > expires;
    },
  };
  exports.ResponseUtils = ResponseUtils;

  // Helper function, converts simple HTTP headers to a map.
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
}(self || window));
