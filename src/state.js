import Store from './store';
import ListenerTree from './listener-tree';
import {
  parsePath,
  stringifyPath,
  arrayFromAllowNullOrUndefined,
} from './utils';

export default class State {
  constructor({
    store = new Store(),
    cursor = [],
    emitters = {
      get: new ListenerTree(),
      set: new ListenerTree(),
    },
  } = {}) {
    this.__store = store;
    this.__cursor = cursor;
    this.__emitters = emitters;
  }

  cursor(subPath = []) {
    const { __store, __cursor, __emitters } = this;
    subPath = parsePath(subPath);
    return new State({
      store: __store,
      cursor: __cursor.concat(subPath),
      emitters: __emitters,
    });
  }

  get(subPath = []) {
    const { length } = arguments;
    if (length !== 0) {
      return this.cursor(subPath).get();
    }
    const value = this.__store.read(this.__cursor);
    this.__emitters.get.emit(this.__cursor, {
      path: stringifyPath(this.__cursor),
      value,
    });
    return value;
  }

  set(subPath, value) {
    const { length } = arguments;
    if (length < 1) {
      throw new TypeError('value argument must be set');
    }
    if (length === 1) {
      [subPath, value] = [undefined, subPath];
    }
    if (subPath !== undefined) {
      return this.cursor(subPath).set(value);
    }
    this.__store.write(this.__cursor, value);
    this.__emitters.set.emit(this.__cursor, {
      path: stringifyPath(this.__cursor),
      value,
    });
  }

  update(subPath, callback) {
    const { length } = arguments;
    if (length < 1) {
      throw new TypeError('callback argument must be set');
    }
    if (length === 1) {
      [subPath, callback] = [undefined, subPath];
    }
    if (typeof callback !== 'function') {
      throw new TypeError('callback argument must be a function');
    }
    const s = subPath === undefined ? this : this.cursor(subPath);
    s.set(callback(s.get()));
  }

  __getEmitterByName(message) {
    if (!this.__emitters[message]) {
      throw new Error('event not allowed');
    }
    return this.__emitters[message];
  }

  on(message, callback) {
    return this.__getEmitterByName(message).on(this.__cursor, callback);
  }

  addEventListener(message, callback) {
    return this.on(message, callback);
  }

  off(message, callback) {
    this.__getEmitterByName(message).off(this.__cursor, callback);
  }

  removeEventListener(message, callback) {
    this.off(message, callback);
  }

  // snapshot support
  snapshot() {
    this.__store.snapshot();
  }

  canUndo() {
    return this.__store.canUndo();
  }

  undo() {
    this.__store.undo();
    // snapshot always emit root event
    this.__emitters.set.emit([], {
      path: stringifyPath([]),
      value: this.__store.read([]),
    });
  }

  canRedo() {
    return this.__store.canRedo();
  }

  redo() {
    this.__store.redo();
    // snapshot always emit root event
    this.__emitters.set.emit([], {
      path: stringifyPath([]),
      value: this.__store.read([]),
    });
  }

  // immutable Array operators
  __arrayOperator(operator, values) {
    const array = arrayFromAllowNullOrUndefined(this.get());
    Array.prototype[operator].apply(array, values);
    this.set(array);
  }

  push(...values) {
    this.__arrayOperator('push', values);
  }

  pop() {
    this.__arrayOperator('pop');
  }

  unshift(...values) {
    this.__arrayOperator('unshift', values);
  }

  shift() {
    this.__arrayOperator('shift');
  }

  fill(value) {
    this.__arrayOperator('fill', [value]);
  }

  reverse() {
    this.__arrayOperator('reverse');
  }

  splice(...values) {
    this.__arrayOperator('splice', values);
  }
}
