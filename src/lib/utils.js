module.exports = {
  /**
   * Helper function to prevent accidental
   * mutation of state objects
   * @param  {object} state    Previous state object
   * @param  {object} newState Properties to merge into state
   * @return {object}          New state object
   */
  updateState(state, newState) {
    return Object.assign({}, state, newState);
  },

  /**
   * Coerces strings, booleans, or integers into booleans
   * @param  {int|string|boolean} value  Original value
   * @return {boolean}                   Coerced value
   */
  parseBoolean(value) {
    return typeof value === 'string' ? value === 'true' : !!value;
  },

  /**
   * For redux actions - simple "request" type action
   * @param  {string} type  e.g. 'REQUEST_FOO'
   * @return {object}       Action object
   */
  request(type) {
    return {type};
  },

  /**
   * For redux actions - simple "receive" type action
   * @param  {string} type  e.g. 'RECEIVE_FOO'
   * @param  {object} data  Any data to be sent with the object
   * @return {object}       Action object
   */
  receive(type, data = {}) {
    return Object.assign({type}, data);
  }
};
