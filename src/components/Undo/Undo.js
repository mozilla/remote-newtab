const React = require("react");

const Undo = React.createClass({
  render: function () {
    //const {currentEngine, searchString} = this.props.Search;
    return (<div className="undo" data-undo-disabled="false">
      <label id="undo-label">Thumbnail removed.</label>
      <button id="undo-button" className="undo-button">Undo.</button>
      <button id="restore-button" className="undo-button">Restore All.</button>
      <div id="undo-close-button" className="close-icon tabbable" data-tooltiptext="CLOSE"></div>
    </div>);
  }
});

module.exports = Undo;
