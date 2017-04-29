import { getRandomId } from './utils';

export class ListenerTreeNode {
  children = {};
  subtreeListeners = {};
  ownListeners = {};
}

const SYMBOL_NOFLUX_ID = '__noflux_id';

export default class ListenerTree {

  __tree = new ListenerTreeNode();

  on(path, listener) {
    // unique id for each listener
    if (listener[SYMBOL_NOFLUX_ID] === undefined) {
      Object.defineProperty(listener, SYMBOL_NOFLUX_ID, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: getRandomId(),
      });
    }
    const listenerId = listener[SYMBOL_NOFLUX_ID];
    let pointer = this.__tree;
    // this will add listener to subtreeListener for every node on path except last
    // e.g. on('a.b.c') will modify subtreeListener of path '' and 'a' and 'a.b'
    for (let i = 0; i < path.length; i++) {
      const next = path[i];
      pointer.subtreeListeners[listenerId] = listener;
      if (pointer.children[next] === undefined) {
        pointer.children[next] = new ListenerTreeNode();
      }
      pointer = pointer.children[next];
    }
    // only add ownListener at the end of path
    pointer.ownListeners[listenerId] = listener;
  }

  // off(listener) {

  // }

  // path [a, b, ..., m, n] will emit
  // unique(ownListener[a] ++ ownListener[b] ++ ... ++ ownListener[m] ++ subtreeListener[n])
  emit(path, data) {
    let listeners = {};
    if (!path.length) {
      listeners = this.__tree.subtreeListeners;
    } else {
      let pointer = this.__tree;
      for (let i = 0; i < path.length; i++) {
        const next = path[i];
        if (Object.keys(pointer.ownListeners).length) {
          // not use { ...listeners } for better performance
          // because listeners should be override for unique
          Object.assign(listeners, pointer.ownListeners);
        }
        // when reach the last node, e.g. on('a.b.c') emit('a.b.c')
        // or no more child listener, e.g. on('a.b') emit('a.b.c')
        if (i === path.length - 1 || pointer.children[next] === undefined) {
          Object.assign(listeners, pointer.subtreeListeners);
          break;
        }
        pointer = pointer.children[next];
      }
    }
    Object.keys(listeners).forEach(listenerId => listeners[listenerId](path, data));
  }
}
