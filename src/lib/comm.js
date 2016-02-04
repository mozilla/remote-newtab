class Comm {
  // Dispatch command to browser
  dispatch(command, data = {}) {
    window.dispatchEvent(new CustomEvent("WebChannelMessageToChrome", {
      detail: {
          id: "newtab",
          message: JSON.stringify({type: command, data: data})
        }
    }));
  }
}

module.exports = new Comm();
