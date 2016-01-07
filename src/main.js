const registerServiceWorker = require("lib/registerServiceWorker");
registerServiceWorker();

const React = require("react");
const ReactDOM = require("react-dom");
const {combineReducers} = require("redux");
const {Provider} = require("react-redux");
const finalCreateStore = require("lib/finalCreateStore");
const reducers = require("reducers/index");
const Base = require("components/Base/Base");
const {IntlProvider, addLocaleData} = require("react-intl");

const reducer = combineReducers(reducers);
const store = finalCreateStore(reducer);

// Load specific locale rules
addLocaleData(window.reactIntlLocaleData);

const intlData = window.newTabLocaleInfo;

const Root = React.createClass({
  render: function () {
    return (<Provider store={store}>
      <IntlProvider {...intlData}>
        <Base />
      </IntlProvider>
    </Provider>);
  }
});

ReactDOM.render(<Root />, document.getElementById("root"));
