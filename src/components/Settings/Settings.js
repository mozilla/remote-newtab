const React = require("react");
const classnames = require("classnames");
const {FormattedMessage, injectIntl} = require("react-intl");

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
    return (<div className="settings">
      <div dir={this.props.intl.formatMessage({id: "locale-dir"})} className="settings-toggle-container">
        <button className="settings-toggle"
          onClick={this.toggleMenu}>
          <img src="./img/icon-gear.svg" />
          <span className="sr-only" ><FormattedMessage id="newtab-customize-title" /></span>
        </button>

        <div className={"settings-menu" + (this.state.showMenu ? " active" : "")}>
          <h3 className="settings-menu-title"><FormattedMessage id="newtab-customize-cog-title2" /></h3>
          <ul>
            <li className={this.props.enabled && "active"}
              onClick={() => this.setPref("browser.newtabpage.enabled", true)}>
              <input type="checkbox" readOnly
                checked={this.props.enabled} /> <FormattedMessage id="newtab-customize-topsites" />
              <br />
              <small >
                <input type="checkbox"
                  checked={this.props.showSuggested}
                  onChange={e => this.setPref("browser.newtabpage.enhanced", e.target.checked)}
                  /> <FormattedMessage id="newtab-customize-cog-enhanced" />
              </small>
            </li>
            <li className={!this.props.enabled && "active"}
              onClick={() => this.setPref("browser.newtabpage.enabled", false)}>
              <input type="checkbox"
                readOnly
                checked={!this.props.enabled} /> <FormattedMessage id="newtab-customize-blank2" />
            </li>
            <li className="active"><FormattedMessage id="newtab-customize-cog-learn" /></li>
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

module.exports = injectIntl(Settings);
