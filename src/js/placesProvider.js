/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/*exported PlacesProvider */

"use strict";

const PlacesProvider = {
  _placesLinks: [],

  _observers: new Set(),

  setLinks(placesLinks) {
    this._placesLinks = placesLinks;
  },

  getLinks() {
    return this._placesLinks;
  },

  addObserver(aObserver) {
    this._observers.add(aObserver);
  },
};
