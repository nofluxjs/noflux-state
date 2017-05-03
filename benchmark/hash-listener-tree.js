function pathify(p) {
  if (Array.isArray(p)) p = p.join('.');
  return '$$_' + p; // prepend special symbols to avoid name conflict with protos
}
function keyify(path, listener) {
  return path + '//' + listener.$id;
}
class ListenTree {
  constructor() {
    this._listeners = [];
    this._count = 1;
    this._listened = {};
  }

  on(p, listener) {
    const path = pathify(p);
    if (!listener.$id) {
      listener.$id = this._count++;
    }
    const key = keyify(path, listener.$id);
    if (this._listened[key]) return;
    if (!this._listeners[path]) this._listeners[path] = [];
    this._listeners[path].push(listener);
    this._listened[key] = true; 
  }

  off(p, listener) {
    const path = pathify(p);
    const listeners = this._listeners[path];
    if (!listeners || !listeners.length) return;
    listeners.splice(listeners.indexOf(listener), 1);
    this._listened[keyify(path, listener)] = false; 
  }

  emit(p) {
    const path = pathify(p);
    const listeners = {};
    Object.keys(this._listeners).forEach(p2 => {
      if (p2.indexOf(path) !== 0 && path.indexOf(p2) !== 0) return;
      (this._listeners[p2] || []).forEach(listener => {
        listeners[listener.$id] = listener;
      });
    });
    Object.keys(listeners).forEach(k => listeners[k]());
  }
}

module.exports = ListenTree;

