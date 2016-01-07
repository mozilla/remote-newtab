// TODO: const OBSERVE_EVENT = 'NewTab:Observe';
const {log} = require('lib/log');

class Comm {

  constructor() {
    this.listeners = new Map();
    this.NEW_TAB_EVENT = 'NewTabCommand';
    this.COMMAND_READY_EVENT = 'NewTabCommandReady';
    this.REGISTER_EVENT = 'NewTab:Register';
    this.GET_INITIAL_STATE_EVENT = 'NewTab:GetInitialState';
    this.STATE_CHANGE_EVENT = 'NewTab:State';
  }

  // Dispatch command to browser
  dispatch(command, data = '') {
    log('COMM: DISPATCH', command, data);
    document.dispatchEvent(new CustomEvent(this.NEW_TAB_EVENT, {
      detail: {command, data}
    }));
  }

  // Add event listener of a particular type
  on(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
    this.dispatch(this.REGISTER_EVENT, {type});
  }

  // Listens on all events given
  all(events, callback) {
    if (!this.listeners.has('*')) this.listeners.set('*', new Set());
    this.listeners.get('*').add(callback);
    events.forEach(type => this.dispatch(this.REGISTER_EVENT, {type}));
  }

  // Removes callback if provided,
  // else removes all listeners of a type
  off(type, callback) {
    if (callback) {
      this.listeners.get(type).delete(callback);
    } else {
      this.listeners.delete(type);
    }
  }

  _baseListener(message) {
    log('COMM: MESSAGE', message.type, message.data);
    const {name, data} = message.data;
    if (this.listeners.has('*')) this.listeners.get('*').forEach(callback => callback(name, data));
    if (this.listeners.has(name)) this.listeners.get(name).forEach(callback => callback(data));
  }

  init(callback) {
    // cache a reference so we can remove the listener
    this._boundBaseListener = this._baseListener.bind(this);

    window.addEventListener('message', this._boundBaseListener);

    document.addEventListener(this.COMMAND_READY_EVENT, () => {
      this.on(this.STATE_CHANGE_EVENT, callback);
      this.dispatch(this.GET_INITIAL_STATE_EVENT);
    });
  }

  destroy() {
    this.listeners.clear();
    if (this._boundBaseListener) window.removeEventListener('message', this._boundBaseListener);
  }

}

module.exports = new Comm();
