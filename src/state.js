import Store from './store';
import { normalizePath } from './utils';

export default class State {

  constructor({ store = new Store(), cursor = [] } = {}) {
    this.__store = store;
    this.__cursor = cursor;
  }

  cursor(subPath = '') {
    const { __store, __cursor } = this;
    subPath = normalizePath(subPath);
    return new State({
      store: __store,
      cursor: __cursor.concat(subPath),
    });
  }

  get(subPath = '') {
    const { length } = arguments;
    if (length !== 0) {
      return this.cursor(subPath).get();
    }
    return this.__store.read(this.__cursor);
  }

  set(subPath, value) {
    const { length } = arguments;
    if (length < 1) {
      throw new TypeError('value argument must be set');
    }
    if (length === 1) {
      value = subPath;
      subPath = undefined;
    }
    if (subPath !== undefined) {
      return this.cursor(subPath).set(value);
    }
    this.__store.write(this.__cursor, value);
  }
}
