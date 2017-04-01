import Store from './store';
import { normalizePath } from './utils';

export default class State {

  constructor({ _store = new Store(), _cursor = [] } = {}) {
    this._store = _store;
    this._cursor = _cursor;
  }

  cursor(subPath = '') {
    const { _store, _cursor } = this;
    subPath = normalizePath(subPath);
    return new State({
      _store,
      _cursor: _cursor.concat(subPath)
    });
  }

  get(subPath = '') {
    const { length } = arguments;
    if (length !== 0) {
      return this.cursor(subPath).get();
    }
    return this._store.read(this._cursor);
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
    this._store.write(this._cursor, value);
  }
}