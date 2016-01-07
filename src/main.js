// require('babel-polyfill');

const React = require('react');
const ReactDOM = require('react-dom');
const {combineReducers} = require('redux');
const {Provider} = require('react-redux');
const finalCreateStore = require('lib/finalCreateStore');
const reducers = require('reducers/index');
const Base = require('components/Base/Base');

const reducer = combineReducers(reducers);
const store = finalCreateStore(reducer);

const Root = React.createClass({
  render: function () {
    return (<Provider store={store}>
      <Base />
    </Provider>);
  }
});

ReactDOM.render(<Root />, document.getElementById('root'));
