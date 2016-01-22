const React = require("react");
const classnames = require("classnames");

const Icon = React.createClass({
  render: function () {
    return (<img className={classnames("icon", {padded: this.props.padded})}
      width={this.props.width}
      height={this.props.height}
      src={this.props.url}
      alt={this.props.alt} />);
  }
});

Icon.propTypes = {
  src: React.PropTypes.string,
  height: React.PropTypes.number,
  width: React.PropTypes.number,
  alt: React.PropTypes.string,
  padded: React.PropTypes.bool
};

const SearchMagic = React.createClass({
  render: function () {
    const currentEngine = this.props.currentEngine;
    const performSearch = this.props.performSearch;
    const currentIcon = currentEngine.icons[0] || {};
    let suggestionsIdIndex = 0;
    let enginesIdIndex = 0;
    return (<div id="search-magic-container" className="search-magic" role="presentation" hidden={!this.props.show}>
      <section className="search-magic-title" hidden={!this.props.suggestions.length}>
        <Icon padded {...currentIcon} /> {currentEngine.placeholder}
      </section>
      <section className="search-magic-suggestions" hidden={!this.props.suggestions.length}>
        <ul role="listbox">
          {this.props.suggestions.map(suggestion => {
            const active = (suggestion === this.props.activeSuggestion);
            const activeEngine = this.props.activeEngine || this.props.currentEngine;
            return (<li key={suggestion} role="presentation">
              <a id={"search-magic-suggestions-" + suggestionsIdIndex++ }
                 className={active ? "active" : ""} role="option"
                 aria-selected={active}
                 onClick={() => performSearch({
                  engineName: activeEngine.name, searchString: suggestion
              })}>{suggestion}</a>
            </li>);
          })}
        </ul>
      </section>
      <section className="search-magic-title">
        <span>Search for <strong>{this.props.searchString}</strong> with:</span>
      </section>
      <section className="search-magic-other-search-partners" role="group">
        <ul>
          {this.props.engines.map(option => {
            const icon = option.icons[0];
            const active = this.props.activeEngine && (this.props.activeEngine.name === option.name);
            return (<li key={option.name} className={active ? "active" : ""}>
              <a id={"search-magic-other-search-partners-" + enginesIdIndex++ } aria-selected={active}
                onClick={() => performSearch({engineName: option.name, searchString: this.props.searchString})}>
              <Icon {...icon} alt={option.name} /></a>
            </li>);
          })}
        </ul>
      </section>
      <section className="search-magic-settings">
        <button id="search-magic-settings-button"
          className={this.props.settingsButtonIsActive ? "active" : ""}
          aria-selected={this.props.settingsButtonIsActive}
          onClick={(e) => {
            e.preventDefault();
            this.props.manageEngines();
        }}>
          Change Search Settings
        </button>
      </section>
    </div>);
  }
});

const EngineShape = React.PropTypes.shape({
  name: React.PropTypes.string.isRequired,
  placeholder: React.PropTypes.string.isRequired
});

SearchMagic.propTypes = {
  currentEngine: EngineShape.isRequired,
  activeEngine: EngineShape,
  activeSuggestion: React.PropTypes.string,
  settingsButtonIsActive: React.PropTypes.bool,
  suggestions: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  engines: React.PropTypes.arrayOf(EngineShape).isRequired,
  searchString: React.PropTypes.string,
  performSearch: React.PropTypes.func.isRequired,
  manageEngines: React.PropTypes.func.isRequired
};

module.exports = SearchMagic;
