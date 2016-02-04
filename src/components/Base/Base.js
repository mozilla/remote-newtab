const React = require("react");
const {connect} = require("react-redux");
const {injectIntl} = require("react-intl");
const {MAX_TILES} = require("lib/constants");

const Platform = require("lib/platform");
const TileUtils = require("lib/TileUtils");
const actions = require("actions/index");

const Tile = require("components/Tile/Tile");
const Block = require("components/Block/Block");
const Search = require("components/Search/Search");
const Settings = require("components/Settings/Settings");

const Base = React.createClass({
  componentWillMount: function () {
    // this.props.dispatch(actions.getPrefs());
    this.props.dispatch(actions.getSuggestedDirectory(this.props.intl.locale));
    this.props.dispatch(actions.initUserDatabase());
    this.props.dispatch(actions.getCurrentEngine());
    this.props.dispatch(actions.getVisibleEngines());
    // this.props.dispatch(actions.getFrecentSites());

    // This adds all our listeners so we can watch for changes
    // and fire actions if anything updates
    this.props.dispatch(actions.addListeners());

    // This will use the message passing API to load history tiles and stuff
    // We won't need it once all the browser APIs are in place
    // this.props.dispatch(actions.initComm());
  },
  componentWillUnmount: function () {
    this.props.dispatch(actions.removeListeners());
  },
  render: function () {
    const prefs = this.props.Prefs;
    const {history, directory} = this.props.Sites;
    let tiles = history;
    if (prefs.showSuggested) tiles = TileUtils.getMergedLinks([history, directory]);
    const blankTiles = [];
    for (let i = 0; i < (MAX_TILES - tiles.length); i++) {
      blankTiles.push(<div className="tile tile-placeholder" />);
    }
    return (<div>
      <Block {...this.props.Block} />
      <Search foo={10} />
      <div className="grid" hidden={!prefs.enabled}>
        {tiles.map((tile, index) => <Tile key={index} {...tile} />)}
        {blankTiles}
      </div>
      <Settings {...prefs} setPrefs={p => Platform.prefs.set(p)} />
    </div>);
  }
});

function select(state) {
  return state;
}

module.exports = connect(select)(injectIntl(Base));
