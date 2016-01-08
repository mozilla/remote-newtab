module.exports = {
  log() {
    console.log.apply(console, arguments); // eslint-disable-line no-console
  },
  warn() {
    console.warn.apply(console, arguments); // eslint-disable-line no-console
  }
};
