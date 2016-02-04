const React = require("react");
const {connect} = require("react-redux");
const actions = require("actions/index");
const blockedLinks = require("lib/blockedLinks");

const Block = React.createClass({
  /**
   * The undo dialog's timeout in miliseconds.
   */
  HIDE_TIMEOUT_MS: 15000,
  _timeout: 0,

  /**
   * Hides the undo dialog.
   */
  hide() {
    this.props.dispatch(actions.setUndoDialogVisibility(false));
    clearTimeout(this._timeout);
    this._timeout = 0;
  },

  undo() {
    blockedLinks.unblock(this.props.blockedURL);
    this.props.dispatch(actions.setUndoDialogVisibility(false));
    this.props.dispatch(actions.updateSites(this.props.url));
  },

  undoAll() {
    blockedLinks.reset();
    this.props.dispatch(actions.setUndoDialogVisibility(false));
    this.props.dispatch(actions.updateSites(this.props.url));
  },

  render: function () {
    if (this.timeout) {
      clearTimeout(this._timeout);
      this._timeout = 0;
    }
    this._timeout = setTimeout(this.hide, this.HIDE_TIMEOUT_MS);
    return (<div className="undo" hidden={!this.props.visible}>
      <label id="undo-label">Thumbnail removed.</label>
      <button id="undo-button" className="undo-button" onClick={e => this.undo(e)}>Undo.</button>
      <button id="restore-button" className="undo-button" onClick={e => this.undoAll(e)}>Restore All.</button>
      <div id="undo-close-button" className="close-icon tabbable"
        data-tooltiptext="CLOSE" onClick={e => this.hide(e)}></div>
    </div>);
  }
});

Block.propTypes = {
  visible: React.PropTypes.bool,
  blockedURL: React.PropTypes.string
};

function select(state) {
  return {
    Block: state.Block
  };
}

module.exports = connect(select)(Block);
