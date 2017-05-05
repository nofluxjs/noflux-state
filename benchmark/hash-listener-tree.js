/* eslint-disable */
let count = 1;
class ListenTree {
  constructor() {
    this._listeners = Object.create(null);
    this._listened = {};
  }

  on(p, listener) {
    const path = `!_${ p.join('#')}`;
    if (!listener.$id) {
      listener.$id = count++;
    }
    const key = path + '//' + listener.$id;
    if (this._listened[key]) return;
    if (!this._listeners[path]) this._listeners[path] = [];
    this._listeners[path].push(listener);
    this._listened[key] = true;
  }

  off(p, listener) {
    const path = `!_${ p.join('#')}`;
    const listeners = this._listeners[path];
    if (!listeners) return;
    var i = 0;
    while (listeners[i] && listener != listeners[i]) i++;
    while (listeners[i] = listeners[i + 1]) i++;
    listeners.length = i;
    this._listened[path + '//' + listener.$id] = false;
  }

  emit(p) {
    const path = `!_${ p.join('#')}`;
    const listeners = this._listeners;
    const len1 = path.length;
    const called = {};
    for (let p2 in listeners) {
      const len2 = p2.length;
      if (len2 >= len1 && p2.slice(0, len1) !== path) continue;
      if (len2 < len1 && path.slice(0, len2) !== p2) continue;
      const subListeners = listeners[p2];
      var i = 0, listener;
      while (listener = subListeners[i++]) {
        if (called[listener.$id]) continue;
        called[listener.$id] = true;
        listener();
      }
    }
  }
}

module.exports = ListenTree;

