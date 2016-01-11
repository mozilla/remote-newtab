const {log} = require("lib/log");

module.exports = function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", {scope: "./"}).then(function (reg) {
      if (reg.installing) {
        log("Service worker installing");
      } else if (reg.waiting) {
        log("Service worker installed");
      } else if (reg.active) {
        log("Service worker active");
      }
    }).catch(function (error) {
      // registration failed
      log("Registration failed with " + error);
    });
  }
};
