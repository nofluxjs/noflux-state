import Store from './store';
import ListenerTree from './listener-tree';
import {
  normalizePath,
  arrayFromAllowNullOrUndefined,
} from './utils';

export default class State {

  constructor({
    store = new Store(),
    cursor = [],
    emitter = new ListenerTree(),
  } = {}) {
    this.__store = store;
    this.__cursor = cursor;
    this.__emitter = emitter;
  }

  // basic operators
  cursor(subPath = []) {
    const { __store, __cursor, __emitter } = this;
    subPath = normalizePath(subPath);
    return new State({
      store: __store,
      cursor: __cursor.concat(subPath),
      emitter: __emitter,
    });
  }

  get(subPath = []) {
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
      [subPath, value] = [undefined, subPath];
    }
    if (subPath !== undefined) {
      return this.cursor(subPath).set(value);
    }
    this.__store.write(this.__cursor, value);
    this.__emitter.emit(this.__cursor, {
      path: this.__cursor.join('.'),
      value,
    });
  }

  // tree event emitter
  __generateEventMessage(message) {
    switch (message) {
      case 'change':
        return this.__cursor;
      default:
        throw new Error('only change event allow');
    }
  }

  on(message, callback) {
    const generatedMessage = this.__generateEventMessage(message);
    this.__emitter.on(generatedMessage, callback);
    // return cleanup handler
    return () => {
      this.__emitter.off(callback);
    };
  }

  addEventListener(message, callback) {
    return this.on(message, callback);
  }

  off(callback) {
    this.__emitter.off(callback);
  }

  removeEventListener(callback) {
    return this.off(callback);
  }

  // snapshot support
  snapshot() {
    return this.__store.snapshot();
  }

  canUndo() {
    return this.__store.canUndo();
  }

  undo() {
    return this.__store.undo();
  }

  canRedo() {
    return this.__store.canRedo();
  }

  redo() {
    return this.__store.redo();
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
