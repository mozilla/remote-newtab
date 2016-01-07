const React = require("react");
const classnames = require("classnames");

const Settings = React.createClass({
  getInitialState: function () {
    return {showMenu: false};
  },
  toggleMenu: function () {
    this.setState({showMenu: !this.state.showMenu});
  },
  setPref: function (key, val) {
    const result = {};
    result[key] = val;
    this.props.setPrefs(result);
  },
  render: function () {
    console.log("HELLO I AM RENDERING THE CUSTOMIZE PANEL=======================");
    const request = new Request("./locale/strings.json");
    console.log(request);
    return (<div className="settings">
      <div className="settings-toggle-container">
        <button className="settings-toggle" onClick={this.toggleMenu}>
          <img src="./img/icon-gear.svg" />
        </button>
        <div className={"settings-menu" + (this.state.showMenu ? " active" : "")}>
          <h3 className="settings-menu-title">{this.props.locale}</h3>
          <ul>
            <li className={this.props.enabled && "active"}
              onClick={() => this.setPref("browser.newtabpage.enabled", true)}>
              <input type="checkbox" readOnly
                checked={this.props.enabled} /> Show your top sites
              <br />
              <small >
                <input type="checkbox"
                  checked={this.props.showSuggested}
                  onChange={e => this.setPref("browser.newtabpage.enhanced", e.target.checked)}
                  /> Include suggested sites
              </small>
            </li>
            <li className={!this.props.enabled && "active"}
              onClick={() => this.setPref("browser.newtabpage.enabled", false)}>
              <input type="checkbox" readOnly checked={!this.props.enabled} /> Show a blank page
            </li>
            <li className="active">Learn about new tab</li>
          </ul>
        </div>
      </div>
      <div className={classnames("settings-overlay", {active: this.state.showMenu})}
        onClick={this.toggleMenu} />
    </div>);
  }
});

Settings.propTypes = {
  enabled: React.PropTypes.bool,
  showSuggested: React.PropTypes.bool,
  setPrefs: React.PropTypes.func.isRequired
};

module.exports = Settings;
