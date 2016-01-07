const assert = require('chai').assert;
const Comm = require('lib/comm');

/**
 * Listen to an event and remove it when the event fires
 * @param  {string}    event     Name of the event
 * @param  {Function}  callback  Callback to fire
 * @param  {Element}   el        Element to listen on
 */
function listen(event, callback, el = document) {
  function onEvent() {
    el.removeEventListener(event, onEvent);
    callback.apply(this, arguments);
  }
  document.addEventListener(event, onEvent);
}

/**
 * Listen to a dispatched new tab event, as if you were the browser
 * @param  {string}   event    Name of the event
 * @param  {Function} callback Callback to fire
 */
function listenTabEvent(event, callback) {
  listen(Comm.NEW_TAB_EVENT, message => {
    callback(message.detail);
  });
}

/**
 * Dispatches a custom event
 * @param  {string}  event  Name of event
 * @param  {any}     data   Data to include in event
 */
function dispatch(event, data) {
  document.dispatchEvent(new CustomEvent(event, data));
}

function dispatchTabEvent(event, data) {
  const e = document.createEvent('Event');
  e.initEvent('message', true, true);
  e.data = {name: event, data};
  window.dispatchEvent(e);
}

describe('Comm', () => {
  beforeEach(() => {
    Comm.init();
  });

  afterEach(() => {
    Comm.destroy();
  });

  it('#dispatch should dispatch an event', done => {
    listen(Comm.NEW_TAB_EVENT, message => {
      assert.deepEqual(message.detail, {command: 'test', data: 'hello 123'});
      done();
    });
    Comm.dispatch('test', 'hello 123');
  });

  it('#on should add a listener', done => {
    const testFunction = () => {};
    listenTabEvent(Comm.REGISTER_EVENT, message => {
      assert.equal(message.command, Comm.REGISTER_EVENT);
      assert.equal(message.data.type, 'foo');
      done();
    });
    Comm.on('foo', testFunction);
    assert.instanceOf(Comm.listeners.get('foo'), Set);
    assert.ok(Comm.listeners.get('foo').has(testFunction));
  });

  it('#all should add a listener for all events', done => {
    const testFunction = () => {};
    listenTabEvent(Comm.REGISTER_EVENT, message => {
      assert.equal(message.command, Comm.REGISTER_EVENT);
      assert.equal(message.data.type, 'foo');
      done();
    });
    Comm.all(['foo'], testFunction);
    assert.instanceOf(Comm.listeners.get('foo'), Set);
    assert.ok(Comm.listeners.get('*').has(testFunction));
  });

  it('#off should remove a listener and leave others', done => {
    const testFunction = () => { throw new Error('function removed with .off was called'); };
    const testFunction2 = () => done();

    Comm.on('hello', testFunction);
    Comm.on('hello', testFunction2);
    Comm.off('hello', testFunction);

    assert.instanceOf(Comm.listeners.get('hello'), Set);
    assert.deepEqual(Comm.listeners.get('hello'), new Set([testFunction2]));
    dispatchTabEvent('hello', {foo: 'bar'});
  });

  it('#off should remove all listeners if only one param is provided', () => {
    const testFunction = () => { throw new Error('function removed with .off was called'); }
    const testFunction2 = () => { throw new Error('function removed with .off was called'); }

    Comm.on('hello', testFunction);
    Comm.on('hello', testFunction2);
    Comm.off('hello');
    assert.isUndefined(Comm.listeners.get('hello'));

    assert.isUndefined(Comm.listeners.get('hello'));
    dispatchTabEvent('hello', {foo: 'bar'});
  });

});
