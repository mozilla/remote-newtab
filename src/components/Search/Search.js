const React = require("react");
const SearchMagic = require("components/SearchMagic/SearchMagic");
const {connect} = require("react-redux");
const actions = require("actions/index");
const Platform = require("lib/platform");

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
    this.props.dispatch(actions.getSuggestions(this.props.Search.currentEngine.name, value));
  },
  getActiveSuggestion: function () {
    // Returns the active/highlighted suggestion, if any.
    const suggestions = this.props.Search.suggestions;
    const index = this.state.activeSuggestionIndex;
    return (suggestions && suggestions.length && index >= 0) ? suggestions[index] : null;
  },
  getActiveEngine: function () {
    // The active engine is different from the current engine. The current
    // engine is the current default search engine of the user. The active engine
    // is set if any of the alternate search engines has been selected via the
    // keyboard.
    const index = this.state.activeEngineIndex;
    if (index >= 0) {
      return this.props.Search.engines[index];
    }
    return null;
  },
  getSettingsButtonIsActive: function () {
    const index = this.state.activeIndex;
    const numSuggestions = this.props.Search.suggestions.length;
    const numEngines = this.props.Search.engines.length;
    return index === numSuggestions + numEngines;
  },
  getActiveDescendantId: function () {
    // Returns the ID of the element being currently in focus, if any.
    const index = this.state.activeIndex;
    const numSuggestions = this.props.Search.suggestions.length;
    const numEngines = this.props.Search.engines.length;
    if (index < numSuggestions) {
      return "search-magic-suggestions-" + index;
    } else if (index < numSuggestions + numEngines) {
      return "search-magic-other-search-partners-" + (index - numSuggestions);
    } else if (index === numSuggestions + numEngines) {
      return "search-magic-settings-button";
    }
    return null;
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
    const index = this.state.activeIndex;
    const numSuggestions = this.props.Search.suggestions.length;
    const numEngines = this.props.Search.engines.length;
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
          searchString: this.getActiveSuggestion() || this.props.Search.searchString
        });
        return;
      default:
        return;
    }

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
    const {currentEngine, searchString} = this.props.Search;
    const showSearchMagic = !!(searchString && this.state.focus);
    return (<form className="search">
      <div className="search-input-wrapper">
        <div className="search-icon" />
        <input ref="input" className="search-input" type="search"
          aria-label="Search query" aria-autocomplete="true"
          aria-controls="search-magic-container"
          aria-expanded={showSearchMagic}
          aria-activedescendant={this.getActiveDescendantId()}
          autoComplete="off" placeholder="Search" maxLength="256"
          value={searchString}
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
        <SearchMagic
          show={showSearchMagic}
          performSearch={this.performSearch}
          activeSuggestion={this.getActiveSuggestion()}
          activeEngine={this.getActiveEngine()}
          settingsButtonIsActive={this.getSettingsButtonIsActive()}
          manageEngines={() => Platform.search.manageEngines()}
          {...this.props.Search} />
      </div>
    </form>);
  }
});

function select(state) {
  return {
    Search: state.Search
  };
}

module.exports = connect(select)(Search);
