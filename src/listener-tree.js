import {
  getNextId,
  stringifyPath,
  SYMBOL_NOFLUX,
} from './utils';

export const getListenerId = (listener, autoGenerate = false) => {
  if (typeof listener !== 'function') {
    throw new TypeError('"listener" argument must be a function');
  }
  // unique id for each listener
  if (listener[SYMBOL_NOFLUX] === undefined && autoGenerate) {
    Object.defineProperty(listener, SYMBOL_NOFLUX, {
      enumerable: false,
      writable: true,
      configurable: true,
      value: { id: getNextId() },
    });
  }
  return listener[SYMBOL_NOFLUX] && listener[SYMBOL_NOFLUX].id;
};

export default class ListenerTree {
  __listeners = {};

  on(path, listener) {
    const pathStr = stringifyPath(path);
    const listenerId = getListenerId(listener, true);
    if (!this.__listeners[pathStr]) {
      this.__listeners[pathStr] = {};
    }
    this.__listeners[pathStr][listenerId] = listener;
    return () => this.off(path, listener);
  }

  off(path, listener) {
    const pathStr = stringifyPath(path);
    const listenerId = getListenerId(listener);
    if (!listenerId || !this.__listeners[pathStr]) {
      return;
    }
    delete this.__listeners[pathStr][listenerId];
    if (Object.keys(this.__listeners[pathStr]) === 0) {
      delete this.__listeners[pathStr];
    }
  }

  emit(path, data) {
    const pathStr = stringifyPath(path);
    const listeners = {};
    Object.keys(this.__listeners)
      .forEach(listenedPath => {
        if (pathStr === ''
          || listenedPath === ''
          || listenedPath.indexOf(pathStr) === 0
          || path.indexOf(listenedPath) === 0) {
          Object.keys(this.__listeners[listenedPath])
            .forEach(listenerId => {
              listeners[listenerId] = this.__listeners[listenedPath][listenerId];
            });
        }
      });
    Object.keys(listeners).forEach(listenerId => listeners[listenerId](data));
  }

  addListener(path, listener) {
    return this.on(path, listener);
  }

  removeListener(path, listener) {
    this.off(path, listener);
  }
}
