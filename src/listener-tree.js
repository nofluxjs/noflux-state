import {
  getRandomId,
  SYMBOL_NOFLUX,
} from './utils';

/*
 * for performance hit, every node maintain ownListeners and subtreeListeners
 * ownListeners[listenerId] = listen on current path
 * subtreeListeners[listenerId] = merge(
 *   ownListeners[listenerId],
 *   children.every.subtreeListeners[listenerId],
 * )
 */
export class ListenerTreeNode {
  children = {};
  subtreeListeners = {};
  ownListeners = {};
  ownListenersTime = {};
  updateSubtreeListeners() {
    const childrenSubtreeListeners = Object.keys(this.children)
      .map(child => this.children[child].subtreeListeners);
    const listenersToMerge = [
      {},
      this.ownListeners,
      ...childrenSubtreeListeners,
    ];
    this.subtreeListeners = Object.assign.apply(null, listenersToMerge);
  }
}

export default class ListenerTree {

  __tree = new ListenerTreeNode();

  __traverse({
    path,
    callbackBeforeRecursion,
    callbackAfterRecursion,
    callbackAtBottom,
  }) {
    function traverse(node, index) {
      if (path && index === path.length) {
        if (callbackAtBottom) {
          callbackAtBottom(node);
        }
      }
      if (callbackBeforeRecursion) {
        callbackBeforeRecursion(node);
      }
      let childrenName;
      if (path) {
        childrenName = index === path.length ? [] : [path[index]];
      } else {
        childrenName = Object.keys(node.children);
      }
      childrenName
        .forEach(child => {
          if (node.children[child] === undefined) {
            node.children[child] = new ListenerTreeNode();
          }
          traverse(node.children[child], index + 1);
        });
      if (callbackAfterRecursion) {
        callbackAfterRecursion(node);
      }
    }
    // start traversing
    traverse(this.__tree, 0);
  }

  addListener(path, listener) {
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
    this.__traverse({
      path,
      callbackAfterRecursion: node => node.updateSubtreeListeners(),
      callbackAtBottom: node => {
        if (node.ownListenersTime[listenerId] > 0) {
          node.ownListenersTime[listenerId] += 1;
        } else {
          node.ownListeners[listenerId] = listener;
          node.ownListenersTime[listenerId] = 1;
        }
      },
    });
  }

  on(path, listener) {
    this.addListener(path, listener);
  }

  // on(path, listener) {
  //   if (typeof listener !== 'function') {
  //     throw new TypeError('"listener" argument must be a function');
  //   }
  //   // unique id for each listener
  //   if (listener[SYMBOL_NOFLUX] === undefined) {
  //     Object.defineProperty(listener, SYMBOL_NOFLUX, {
  //       enumerable: false,
  //       writable: true,
  //       configurable: true,
  //       value: { id: getRandomId() },
  //     });
  //   }
  //   const listenerId = listener[SYMBOL_NOFLUX].id;
  //   let pointer = this.__tree;
  //   // this will add listener to subtreeListener for every node on path except last
  //   // e.g. on('a.b.c') will modify subtreeListener on path '' and 'a' and 'a.b' and 'a.b.c'
  //   pointer.subtreeListeners[listenerId] = listener;
  //   for (let i = 0; i < path.length; i++) {
  //     const next = path[i];
  //     if (pointer.children[next] === undefined) {
  //       pointer.children[next] = new ListenerTreeNode();
  //     }
  //     pointer.children[next].subtreeListeners[listenerId] = listener;
  //     pointer = pointer.children[next];
  //   }
  //   // only add ownListener at the end of path, e.g. 'a.b.c'
  //   pointer.ownListeners[listenerId] = listener;
  // }

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

  // path [a, b, ..., n] will emit
  // merge(ownListener[root], ownListener[a], ownListener[b], ..., subtreeListener[n])
  emit(path, data) {
    const listeners = this.__getListenersByEmitPath(path);
    for (const listenerId in listeners) {
      const listener = listeners[listenerId];
      // prevent to call if listener is off while emit
      if (listener !== undefined) {
        listener(data);
      }
    }
  }
}
