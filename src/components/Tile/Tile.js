const React = require('react');

const Tile = React.createClass({
  render: function () {
    return (<a className="tile" href={this.props.url}>
      <div className="tile-img-container">
        {this.props.imageURI && <div className="tile-img" style={{backgroundImage: `url(${this.props.imageURI})`}} />}
        {this.props.enhancedImageURI && <div className="tile-img-rollover" style={{backgroundImage: `url(${this.props.enhancedImageURI})`}} />}
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

module.exports = Tile;
