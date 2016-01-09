const finalCreateStore = require('lib/finalCreateStore');
const {assert} = require('chai');

describe('finalCreateStore', () => {
  it('should create a store', () => {
    const store = finalCreateStore((state) => state);
    assert.ok(store);
    assert.property(store, 'dispatch');
    assert.property(store, 'getState');
    assert.property(store, 'replaceReducer');
    assert.property(store, 'subscribe');
  });
});
