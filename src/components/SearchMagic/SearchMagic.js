const React = require('react');
const classnames = require('classnames');

const Icon = React.createClass({
  render: function () {
    return (<img className={classnames('icon', {padded: this.props.padded})}
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
    return (<div className="search-magic" hidden={!this.props.show}>
      <section className="search-magic-title" hidden={!this.props.suggestions.length}>
        <Icon padded {...currentIcon} /> {currentEngine.placeholder}
      </section>
      <section className="search-magic-suggestions" hidden={!this.props.suggestions.length}>
        <ul>
          {this.props.suggestions.map(suggestion => {
            return (<li key={suggestion}>
              <a onClick={() => performSearch({engineName: currentEngine.name, searchString: suggestion})}>{suggestion}</a>
            </li>);
          })}
        </ul>
      </section>
      <section className="search-magic-title">
        <span>Search for <strong>{this.props.searchString}</strong> with:</span>
      </section>
      <section className="search-magic-other-search-partners">
        <ul>
          {this.props.engines.map(option => {
            const icon = option.icons[0];
            return (<li key={option.name}>
              <a onClick={() => performSearch({engineName: option.name, searchString: this.props.searchString})}>
              <Icon {...icon} alt={option.name} /></a>
            </li>);
          })}
        </ul>
      </section>
      <section className="search-magic-settings">
        <button onClick={(e) => {
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
  suggestions: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  engines: React.PropTypes.arrayOf(EngineShape).isRequired,
  searchString: React.PropTypes.string,
  performSearch: React.PropTypes.func.isRequired,
  manageEngines: React.PropTypes.func.isRequired
};

module.exports = SearchMagic;
