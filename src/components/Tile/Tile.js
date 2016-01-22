const React = require("react");
const gBlockedLinks = require('lib/blockedLinks');
const async = require("lib/async");
const {connect} = require("react-redux");
const actions = require("actions/index");

const Tile = React.createClass({
  /**
   * Blocks the site (removes it from the grid) and calls the given callback
   * when done.
   */
  block: function(e) {
    e.preventDefault();
    if (!this.isBlocked()) {
      gBlockedLinks.block(this.props.url);
      this.props.dispatch(actions.setUndoDialogVisibility(true, this.props.url));
      this.props.dispatch(actions.updateSites());
    }
  },


  /**
   * Checks whether this site is blocked.
   *
   * @return {Boolean} Whether this site is blocked.
   */
  isBlocked: function() {
    return gBlockedLinks.isBlocked(this.props.url);
  },

  render: function () {
    return (<a className="tile" href={this.props.url}>
      <div className="tile-img-container">
        <button className="control control-block" title="Remove this site" onClick={e => this.block(e)}></button>
        {this.props.imageURI && <div className="tile-img"
          style={{backgroundImage: `url(${this.props.imageURI})`}} />}
        {this.props.enhancedImageURI && <div className="tile-img-rollover"
          style={{backgroundImage: `url(${this.props.enhancedImageURI})`}} />}
      </div>
      <div className="tile-title">
        {this.props.title}
      </div>
    </a>);
  }
});

Tile.propTypes = {
  title: React.PropTypes.string.isRequired,
  imageURI: React.PropTypes.string,
  enhancedImageURI: React.PropTypes.string,
  url: React.PropTypes.string.isRequired
};

function select(state) {
  return {
    Tile: state.Tile
  };
}

module.exports = connect(select)(Tile);
