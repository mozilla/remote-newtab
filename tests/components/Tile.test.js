const assert = require('chai').assert;
const Tile = require('components/Tile/Tile');
const React = require('react');
const ReactDOM = require('react-dom');

const fakeProps = {
  title: 'My tile',
  imageURI: 'https://foo.com/foo.jpg',
  url: 'https://foo.com'
};

describe('Tile', () => {

  let node, tile, el;
  beforeEach(() => {
    node = document.createElement('div');
    tile = ReactDOM.render(<Tile {...fakeProps} />, node);
    el = ReactDOM.findDOMNode(tile);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe('valid tile', () => {
    it('should create a Tile', () => {
      assert.instanceOf(tile, Tile);
    });

    it('should have an image', () => {
      const imgEl = el.querySelector('.tile-img');
      assert.ok(imgEl);
      assert.include(imgEl.style.backgroundImage, 'https://foo.com/foo.jpg');

    });

    it('should have the right title', () => {
      assert.equal(el.querySelector('.tile-title').innerHTML, 'My tile');
    });

    it('should have a link', () => {
      assert.equal(el.href, 'https://foo.com/');
    });
  });

  describe('enhancedImageURI', () => {
    it('should not have an element if no enhanced image is provided', () => {
      assert.isNull(el.querySelector('.tile-img-rollover'));
    });

    it('should have an enhanced image element if it is provided ', () => {
      ReactDOM.render(<Tile {...fakeProps} enhancedImageURI="https://foo.com/foo-rollover.jpg" />, node);
      const rolloverEl = el.querySelector('.tile-img-rollover');
      assert.ok(rolloverEl);
      assert.include(rolloverEl.style.backgroundImage, 'https://foo.com/foo-rollover.jpg');
    });
  });

  describe('missing props', () => {
    it('should warn if title is missing', () => {
      assert.throw(
        () => ReactDOM.render(<Tile url="foo.com" />, node),
        /Failed propType/
      );
    });
    it('should warn if url is missing', () => {
      assert.throw(
        () => ReactDOM.render(<Tile title="foo" />, node),
        /Failed propType/
      );
    });
  });

});
