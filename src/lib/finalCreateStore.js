const {createStore, applyMiddleware, compose} = require('redux');
const thunk = require('redux-thunk');
const createLogger = require('redux-logger');

module.exports = function finalCreateStore(reducer) {
  // TODO: turn off for production based on config
  const loggerMiddleware = createLogger({
    level: 'info',
    collapsed: true
  });

  const middleware = [thunk];
  if (__CONFIG__.LOGGING) middleware.push(loggerMiddleware);

  const configureStoreFn = compose(
    applyMiddleware(...middleware)
  )(createStore);

  return configureStoreFn(reducer);
};
