/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const XUL_NAMESPACE = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const TILES_EXPLAIN_LINK = "https://support.mozilla.org/kb/how-do-tiles-work-firefox";
const TILES_INTRO_LINK = "https://www.mozilla.org/firefox/tiles/";
const TILES_PRIVACY_LINK = "https://www.mozilla.org/privacy/";

let listeners = {};

function init() {
  // Add a listener for messages sent from the browser.
  // The listener calls our associated callback functions.
  window.addEventListener("message", message => {
    for (let callback of listeners[message.data.name]) {
      callback(message.data.data);
    }
  }, false);
}

function newTabString(name, args) {
  let stringName = "newtab." + name;
  if (!args) {
    return gStrings[stringName];
  }
  return formatStringFromName(stringName, args, args.length);
}

function formatStringFromName(str, substrArr) {
  let regExp = /%[0-9]\$S/g;
  let matches;
  while (matches = regExp.exec(str)) {
    let match = matches[0];
    let index = match.charAt(1); // Get the digit in the regExp.
    str = str.replace(match, substrArr[index - 1]);
  }
  return str;
}

function stringifySites() {
  let stringifiedSites = [];
  for (let site of gGrid.sites) {
    stringifiedSites.push(site ? JSON.stringify(site._link) : site);
  }
  return stringifiedSites;
}

function sendToBrowser(type, data) {
  let event = new CustomEvent("NewTabCommand", {
    detail: {
      command: type,
      data: data
    }
  });
  try {
    document.dispatchEvent(event);
  } catch (e) {
    console.log(e);
  }
}

function registerListener(type, callback) {
  if (!listeners[type]) {
    listeners[type] = [];
  }
  listeners[type].push(callback);
  sendToBrowser("NewTab:Register", {type});
}

function inPrivateBrowsingMode() {
  return false;
  //return PrivateBrowsingUtils.isContentWindowPrivate(window);
}


// Everything is loaded. Initialize the New Tab Page.
init();
window.addEventListener("load", () => {
  gPage.init();
});

