import { EventEmitter2 } from 'eventemitter2';
import { Observable } from 'rxjs/Observable';
import { fromEvent } from 'rxjs/observable/fromEvent';
import Store from './store';
import { normalizePath } from './utils';

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

  cursor(subPath = '') {
    const { __store, __cursor, __emitter } = this;
    subPath = normalizePath(subPath);
    return new State({
      store: __store,
      cursor: __cursor.concat(subPath),
      emitter: __emitter,
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
    this.__emitter.emit(['change', ...this.__cursor, '**'].join('.'), value);
  }

  listen(message) {
    let generatedMessage;
    switch (message) {
      case 'change':
        generatedMessage = ['change', ...this.__cursor, '**'].join('.');
        break;
      default:
        generatedMessage = message;
        break;
    }
    return Observable::fromEvent(this.__emitter, generatedMessage);
  }
}
