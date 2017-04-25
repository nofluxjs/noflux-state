import { EventEmitter2 } from 'eventemitter2';
import Store from './store';
import { normalizePath, arrayFromAllowNullOrUndefined } from './utils';

export default class State {

  constructor({
    store = new Store(),
    cursor = [],
    emitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      // FIXME: is it good?
      maxListeners: Infinity,
    }),
  } = {}) {
    this.__store = store;
    this.__cursor = cursor;
    this.__emitter = emitter;
  }

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
    this.__emitter.emit(['change', ...this.__cursor, '**'], {
      path: this.__cursor.join('.'),
      value,
    });
  }

  __generateEventMessage(message) {
    switch (message) {
      case 'change':
        return ['change', ...this.__cursor, '**'];
      default:
        return message;
    }
  }

  on(message, callback) {
    const generatedMessage = this.__generateEventMessage(message);
    this.__emitter.on(generatedMessage, callback);
    // return cleanup handler
    return () => {
      this.__emitter.off(generatedMessage, callback);
    };
  }
  addEventListener(message, callback) {
    return this.on(message, callback);
  }
  off(message, callback) {
    const generatedMessage = this.__generateEventMessage(message);
    this.__emitter.off(generatedMessage, callback);
  }
  removeEventListener(message, callback) {
    return this.off(message, callback);
  }

  // immutable Array operators
  __arrayOperator(subPath, operator, values) {
    const cursor = this.cursor(subPath);
    const array = arrayFromAllowNullOrUndefined(cursor.get());
    Array.prototype[operator].apply(array, values);
    cursor.set(array);
  }

  push(subPath, ...values) {
    this.__arrayOperator(subPath, 'push', values);
  }

  pop(subPath) {
    this.__arrayOperator(subPath, 'pop');
  }

  unshift(subPath, ...values) {
    this.__arrayOperator(subPath, 'unshift', values);
  }

  shift(subPath) {
    this.__arrayOperator(subPath, 'shift');
  }

  fill(subPath, value) {
    this.__arrayOperator(subPath, 'fill', [value]);
  }

  reverse(subPath) {
    this.__arrayOperator(subPath, 'reverse');
  }

  splice(subPath, ...values) {
    this.__arrayOperator(subPath, 'splice', values);
  }
}
