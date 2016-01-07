const req = require.context('.', true, /\.test.js$/);
const files = req.keys();

// Throw if we get console.error
const error = console.error;
console.error = function mockError(msg) {
  if (/(Invalid prop|Failed propType)/.test(msg)) {
    throw new Error(msg);
  }
  error.apply(console, arguments);
};

files.forEach(file => req(file));
