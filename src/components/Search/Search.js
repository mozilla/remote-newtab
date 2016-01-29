const React = require("react");
const classnames = require("classnames");
const {connect} = require("react-redux");
const actions = require("actions/index");
const Platform = require("lib/platform");

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

const Search = React.createClass({
  getInitialState: function () {
    return {
      focus: false,
      // The following indexes are to keep track of where the user is if they
      // are navigating the widget with the keyboard.
      activeIndex: -1,
      activeSuggestionIndex: -1,
      activeEngineIndex: -1
    };
  },
  setValueAndSuggestions: function (value) {
    this.setState({activeIndex: -1, activeSuggestionIndex: -1});
    this.props.dispatch(actions.updateSearchString(value));
    this.props.dispatch(actions.getSuggestions(this.props.currentEngine.name, value));
  },
  getActiveSuggestion: function () {
    // Returns the active/highlighted suggestion, if any.
    const suggestions = this.props.suggestions;
    const index = this.state.activeSuggestionIndex;
    return (suggestions && suggestions.length && index >= 0) ? suggestions[index] : null;
  },
  getActiveEngine: function () {
    // The active engine is different from the current engine. The current
    // engine is the current default search engine of the user. The active engine
    // is the engine selected by the user in the widget, if any. It fallsback
    // to the current default.
    const index = this.state.activeEngineIndex;
    return (index >= 0) ? this.props.engines[index] : this.props.currentEngine;
  },
  getSettingsButtonIsActive: function () {
    const index = this.state.activeIndex;
    const numSuggestions = this.props.suggestions.length;
    const numEngines = this.props.engines.length;
    return index === numSuggestions + numEngines;
  },
  getActiveDescendantId: function () {
    // Returns the ID of the element being currently in focus, if any.
    const index = this.state.activeIndex;
    const numSuggestions = this.props.suggestions.length;
    const numEngines = this.props.engines.length;
    if (index < numSuggestions) {
      return "search-suggestions-" + index;
    } else if (index < numSuggestions + numEngines) {
      return "search-other-search-partners-" + (index - numSuggestions);
    } else if (index === numSuggestions + numEngines) {
      return "search-settings-button";
    }
    return null;
  },
  getDropdownVisible: function () {
    return !!(this.props.searchString && this.state.focus);
  },
  performSearch: function (options) {
    Platform.search.performSearch({
      engineName: options.engineName,
      searchString: options.searchString,
      healthReportKey: "1",
      searchPurpose: "d"
    });
  },
  handleKeypress: function (evt) {
    // Handle the keyboard navigation of the widget.

    // If the dropdown isn't visible, we don't handle the event.
    if (!this.getDropdownVisible()) {
      return;
    }

    const index = this.state.activeIndex;
    const numSuggestions = this.props.suggestions.length;
    const numEngines = this.props.engines.length;
    let newIndex = index;
    let newSuggestionIndex = this.state.activeSuggestionIndex;
    let newEngineIndex = this.state.activeEngineIndex;
    switch (evt.key) {
      case "ArrowDown":
        if (index < numSuggestions + numEngines) {
          newIndex++;
          if (index < numSuggestions - 1) {
            // We are in suggestions, move down until the last one.
            newSuggestionIndex++;
          } else if (index === numSuggestions - 1) {
            // We are on the last suggestion, reset suggestion index and
            // start on the engine index.
            newSuggestionIndex = -1;
            newEngineIndex++;
          } else if (index < numSuggestions + numEngines - 1) {
            // We are in engines, keep going until the last one.
            newEngineIndex++;
          } else if (index === numSuggestions + numEngines - 1) {
            // We are on the last engine, reset engine index.
            newEngineIndex = -1;
          }
        } else {
          // We reached the end. Reset to -1.
          newIndex = -1;
        }
        break;
      case "ArrowUp":
        if (index > -1) {
          newIndex--;
          if (index < numSuggestions) {
            // We are in suggestions, move on up.
            newSuggestionIndex--;
          } else if (index === numSuggestions) {
            // We are on the first engine, reset engine index and move to
            // last suggestion.
            newEngineIndex = -1;
            newSuggestionIndex = numSuggestions - 1;
          } else if (index < numSuggestions + numEngines) {
            // We are on the engine list, move on up.
            newEngineIndex--;
          } else {
            // We are on the button, move to last engine.
            newEngineIndex = numEngines - 1;
          }
        } else {
          // Nothing is selected, go to the very end.
          newIndex = numSuggestions + numEngines;
        }
        break;
      case "Tab":
        // Tab only navigates through the engines list.
        if (!evt.shiftKey) {
          // Shift isn't pressed, go forward.
          if (index === numSuggestions + numEngines) {
            // We reached the end, let the event go on.
            return;
          }
          if (index < numSuggestions) {
            // We aren't in the engines list yet, move to first engine.
            newIndex = numSuggestions;
            newEngineIndex = 0;
          } else {
            // We are in the engines list, move along.
            newIndex++;
            newEngineIndex++;
          }
        } else {
          // Shift is pressed, go backward.
          if (index < numSuggestions) {
            // We aren't on the engines list, ;et the event move on.
            return;
          }
          if (index === numSuggestions) {
            // We are on the first engine, unselect it and go to where we were
            // in the suggestions list.
            newEngineIndex = -1;
            newIndex = newSuggestionIndex;
          } else if (index < numSuggestions + numEngines) {
            // We are in the engines list, move up the list.
            newIndex--;
            newEngineIndex--;
          } else {
            // We are on the button, go to bottom of engine list.
            newIndex--;
            newEngineIndex = numEngines - 1;
          }
        }
        break;
      case "Enter":
        evt.preventDefault();
        // If the change settings button is selected, fire the action for it.
        if (this.getSettingsButtonIsActive()) {
          Platform.search.manageEngines();
          return;
        }

        // Otherwise, perform the search with active engine and suggestion.
        this.performSearch({
          engineName: this.getActiveEngine(),
          searchString: this.getActiveSuggestion() || this.props.searchString
        });
        return;
      default:
        return;
    }

    // We only get here if arrows or tabs were pressed. The other cases already
    // returned above.
    evt.preventDefault();
    this.setState({
      activeIndex: newIndex,
      activeSuggestionIndex: newSuggestionIndex,
      activeEngineIndex: newEngineIndex
    });
  },
  resetState: function () {
    this.setState(this.getInitialState());
  },
  render: function () {
    const {currentEngine, searchString} = this.props;
    const currentIcon = currentEngine.icons[0] || {};
    let suggestionsIdIndex = 0;
    let enginesIdIndex = 0;
    return (<form className="search">
      <div className="search-input-wrapper">
        <div className="search-icon" />
        <input ref="input" className="search-input" type="search"
          aria-label="Search query" aria-autocomplete="true"
          aria-controls="search-container"
          aria-expanded={this.getDropdownVisible()}
          aria-activedescendant={this.getActiveDescendantId()}
          autoComplete="off" placeholder="Search" maxLength="256"
          value={searchString}
          placeholder="Search"
          onChange={e => this.setValueAndSuggestions(e.target.value)}
          onFocus={() => this.setState({focus: true})}
          onBlur={() => setTimeout(() => this.resetState(), 200)}
          onKeyDown={e => this.handleKeypress(e)} />
        <button onClick={e => {
          e.preventDefault();
          this.performSearch({engineName: currentEngine.name, searchString});
        }} className="search-submit" aria-label="Submit search">
         <span className="sr-only" >Search</span>
        </button>
        <div id="search-container" role="presentation" hidden={!this.getDropdownVisible()}>
          <section className="search-title" hidden={!this.props.suggestions.length}>
            <Icon padded {...currentIcon} /> {currentEngine.placeholder}
          </section>
          <section className="search-suggestions" hidden={!this.props.suggestions.length}>
            <ul role="listbox">
              {this.props.suggestions.map(suggestion => {
                const active = (this.state.activeSuggestionIndex === suggestionsIdIndex);
                const activeEngine = this.getActiveEngine();
                return (<li key={suggestion} role="presentation">
                  <a id={"search-suggestions-" + suggestionsIdIndex++ }
                     className={active ? "active" : ""} role="option"
                     aria-selected={active}
                     onClick={() => this.performSearch({
                      engineName: activeEngine.name, searchString: suggestion
                  })}>{suggestion}</a>
                </li>);
              })}
            </ul>
          </section>
          <section className="search-title">
            <span>Search for <strong>{this.props.searchString}</strong> with:</span>
          </section>
          <section className="search-other-search-partners" role="group">
            <ul>
              {this.props.engines.map(option => {
                const icon = option.icons[0];
                const active = (this.state.activeEngineIndex === enginesIdIndex);
                return (<li key={option.name} className={active ? "active" : ""}>
                  <a id={"search-other-search-partners-" + enginesIdIndex++ } aria-selected={active}
                    onClick={() => this.performSearch({
                      engineName: option.name, searchString: this.getActiveSuggestion()
                  })}>
                  <Icon {...icon} alt={option.name} /></a>
                </li>);
              })}
            </ul>
          </section>
          <section className="search-settings">
            <button id="search-settings-button"
              className={this.getSettingsButtonIsActive() ? "active" : ""}
              aria-selected={this.getSettingsButtonIsActive()}
              onClick={(e) => {
                e.preventDefault();
                this.props.manageEngines();
            }}>
              Change Search Settings
            </button>
          </section>
        </div>
      </div>
    </form>);
  }
});

function select(state) {
  return state.Search;
}

module.exports = connect(select)(Search);
