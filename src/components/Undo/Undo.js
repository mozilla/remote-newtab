const React = require("react");
const {connect} = require("react-redux");
const actions = require("actions/index");
const gBlockedLinks = require('lib/blockedLinks');

const Undo = React.createClass({
  /**
   * The undo dialog's timeout in miliseconds.
   */
  HIDE_TIMEOUT_MS: 15000,
  timeout: null,

  /**
   * Hides the undo dialog.
   */
  hide() {
    this.props.dispatch(actions.setUndoDialogVisibility(false));
    clearTimeout(this.timeout);
  },

  undo() {
    gBlockedLinks.unblock(this.props.blockedURL);
    this.props.dispatch(actions.setUndoDialogVisibility(false));
    this.props.dispatch(actions.updateSites(this.props.url));
  },

  undoAll() {
    gBlockedLinks.reset();
    this.props.dispatch(actions.setUndoDialogVisibility(false));
    this.props.dispatch(actions.updateSites(this.props.url));
  },

  render: function () {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(this.hide, this.HIDE_TIMEOUT_MS);
    return (<div className="undo" hidden={!this.props.visible}>
      <label id="undo-label">Thumbnail removed.</label>
      <button id="undo-button" className="undo-button" onClick={e => this.undo(e)}>Undo.</button>
      <button id="restore-button" className="undo-button" onClick={e => this.undoAll(e)}>Restore All.</button>
      <div id="undo-close-button" className="close-icon tabbable" data-tooltiptext="CLOSE" onClick={e => this.hide(e)}></div>
    </div>);
  }
});

Undo.propTypes = {
  visible: React.PropTypes.bool,
  blockedURL: React.PropTypes.string
};

function select(state) {
  return {
    Undo: state.Undo
  };
}

module.exports = connect(select)(Undo);
