import {
  getRandomId,
  SYMBOL_NOFLUX,
} from './utils';

/*
 * for performance hit, every node maintain ownListeners and subtreeListeners
 * ownListeners[listenerId] = listen on current path
 * subtreeListeners[listenerId] = ownListeners[listenerId]
 *   || children.any.subtreeListeners[listenerId]
 */
export class ListenerTreeNode {
  children = {};
  subtreeListeners = {};
  ownListeners = {};
}

export default class ListenerTree {

  __tree = new ListenerTreeNode();

  on(path, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('"listener" argument must be a function');
    }
    // unique id for each listener
    if (listener[SYMBOL_NOFLUX] === undefined) {
      Object.defineProperty(listener, SYMBOL_NOFLUX, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: { id: getRandomId() },
      });
    }
    const listenerId = listener[SYMBOL_NOFLUX].id;
    let pointer = this.__tree;
    // this will add listener to subtreeListener for every node on path except last
    // e.g. on('a.b.c') will modify subtreeListener on path '' and 'a' and 'a.b'
    for (let i = 0; i < path.length; i++) {
      const next = path[i];
      pointer.subtreeListeners[listenerId] = listener;
      if (pointer.children[next] === undefined) {
        pointer.children[next] = new ListenerTreeNode();
      }
      pointer = pointer.children[next];
    }
    // only add ownListener at the end of path, e.g. 'a.b.c'
    pointer.ownListeners[listenerId] = listener;
  }

  __offOnNode(node, listenerId) {
    if (node.ownListeners[listenerId]) {
      delete node.ownListeners[listenerId];
    }
    if (node.subtreeListeners[listenerId]) {
      let hasSubtreeListener = false;
      for (const child in node.children) {
        const childNode = node.children[child];
        this.__offOnNode(childNode, listenerId);
        if (childNode.subtreeListeners[listenerId] || childNode.ownListeners[listenerId]) {
          hasSubtreeListener = true;
        } else {
          delete node.children[child];
        }
      }
      if (!hasSubtreeListener) {
        delete node.subtreeListeners[listenerId];
      }
    }
  }

  off(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('"listener" argument must be a function');
    }
    if (listener[SYMBOL_NOFLUX] === undefined) {
      return;
    }
    this.__offOnNode(this.__tree, listener[SYMBOL_NOFLUX].id);
  }

  __getListenersByEmitPath(path) {
    const listeners = {};
    let pointer = this.__tree;
    for (let i = 0; i < path.length; i++) {
      const next = path[i];
      if (Object.keys(pointer.ownListeners).length) {
        // not use { ...listeners } for better performance
        // because listeners should be override for unique
        Object.assign(listeners, pointer.ownListeners);
      }
      // no more child listener found, e.g. on('a.b') emit('a.b.c')
      if (pointer.children[next] === undefined) {
        return listeners;
      }
      pointer = pointer.children[next];
    }
    Object.assign(listeners, pointer.subtreeListeners);
    return listeners;
  }

  // path [a, b, ..., m, n] will emit
  // merge(ownListener[a], ownListener[b], ..., ownListener[m], subtreeListener[n])
  emit(path, data) {
    const listeners = this.__getListenersByEmitPath(path);
    for (const listenerId in listeners) {
      const listener = listeners[listenerId];
      // prevent to call if listener is off while emit
      if (listener !== undefined) {
        listener(path, data);
      }
    }
  }
}
