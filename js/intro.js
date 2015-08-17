/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const PREF_INTRO_SHOWN = "browser.newtabpage.introShown";
const PREF_NEWTAB_ENHANCED = "browser.newtabpage.enhanced";

let gIntro = {
  _nodeIDSuffixes: [
    "mask",
    "modal",
    "text",
    "buttons",
    "header",
    "footer"
  ],

  _paragraphs: [],

  _nodes: {},

  init: function() {
    for (let idSuffix of this._nodeIDSuffixes) {
      this._nodes[idSuffix] = document.getElementById("newtab-intro-" + idSuffix);
    }
  },

  _showMessage: function() {
    // Set the paragraphs
    let paragraphNodes = this._nodes.text.getElementsByTagName("p");

    this._paragraphs.forEach((arg, index) => {
      paragraphNodes[index].innerHTML = arg;
    });

    // Set the button
    document.getElementById("newtab-intro-button").
             setAttribute("value", gNewTab.newTabString("intro.gotit"));
  },

  _bold: function(str) {
    return `<strong>${str}</strong>`;
  },

  _link: function(url, text) {
    return `<a href="${url}" target="_blank">${text}</a>`;
  },

  _exitIntro: function() {
    this._nodes.mask.style.opacity = 0;
    this._nodes.mask.addEventListener("transitionend", () => {
      this._nodes.mask.style.display = "none";
    });
  },

  _generateParagraphs: function() {
    let customizeIcon = '<input type="button" class="newtab-control newtab-customize"/>';
    this._paragraphs.push(gNewTab.newTabString("intro1.paragraph1"));
    this._paragraphs.push(gNewTab.newTabString("intro1.paragraph2",
                            [
                              this._link(TILES_PRIVACY_LINK, gNewTab.newTabString("privacy.link")),
                              customizeIcon
                            ]));
  },

  showIfNecessary: function() {
    if (!gNewTab.enhanced) {
      return;
    }
    if (!gNewTab.introShown) {
      this.showPanel();
      gNewTab.introShown = true;
      gNewTab.sendToBrowser("NewTab:IntroShown");
    }
  },

  showPanel: function() {
    this._nodes.mask.style.display = "block";
    this._nodes.mask.style.opacity = 1;

    if (!this._paragraphs.length) {
      // It's our first time showing the panel. Do some initial setup
      this._generateParagraphs();
    }
    this._showMessage();

    // Header text
    this._nodes.header.innerHTML = gNewTab.newTabString("intro.header.update");

    // Footer links
    let footerLinkNode = document.getElementById("newtab-intro-link");
    footerLinkNode.innerHTML = this._link(TILES_INTRO_LINK, gNewTab.newTabString("learn.link2"))
  },
};
