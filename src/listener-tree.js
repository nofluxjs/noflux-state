import {
  getRandomId,
  SYMBOL_NOFLUX,
} from './utils';

export const getListenerId = (listener, autoGenerate = false) => {
  if (typeof listener !== 'function') {
    throw new TypeError('"listener" argument must be a function');
  }
  // unique id for each listener
  if (listener[SYMBOL_NOFLUX] === undefined) {
    if (autoGenerate) {
      Object.defineProperty(listener, SYMBOL_NOFLUX, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: { id: getRandomId() },
      });
    }
  }
  return listener[SYMBOL_NOFLUX] && listener[SYMBOL_NOFLUX].id;
};

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
    this.subtreeListeners = Object.assign(...listenersToMerge);
  }
}

export default class ListenerTree {
  __tree = new ListenerTreeNode();

  __traverse({
    path,
    createEmptyPath = false,
    callbackBeforeRecursion,
    callbackAfterRecursion,
    callbackAtBottom,
  }) {
    function traverse(node, index) {
      let isAtBottom = false;
      if (path) {
        if (index === path.length) {
          isAtBottom = true;
        } else if (!createEmptyPath && node.children[path[index]] === undefined) {
          isAtBottom = true;
        }
        if (isAtBottom && callbackAtBottom) {
          callbackAtBottom(node, index);
        }
      }
      if (callbackBeforeRecursion) {
        callbackBeforeRecursion(node);
      }
      let childrenName;
      if (path) {
        childrenName = isAtBottom ? [] : [path[index]];
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
    const listenerId = getListenerId(listener, true);
    this.__traverse({
      path,
      createEmptyPath: true,
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
    return function handler() {
      this.removeListener(path, listener);
    };
  }

  removeListener(path, listener) {
    const listenerId = getListenerId(listener);
    this.__traverse({
      path,
      callbackAfterRecursion: node => node.updateSubtreeListeners(),
      callbackAtBottom: node => {
        if (node.ownListeners[listenerId]) {
          node.ownListenersTime[listenerId] -= 1;
          if (node.ownListenersTime[listenerId] === 0) {
            delete node.ownListenersTime[listenerId];
            delete node.ownListeners[listenerId];
          }
        }
      },
    });
  }

  removeAllListeners(listener) {
    const listenerId = getListenerId(listener);
    this.__traverse({
      callbackAfterRecursion: node => {
        if (node.ownListeners[listenerId]) {
          delete node.ownListenersTime[listenerId];
          delete node.ownListeners[listenerId];
        }
        node.updateSubtreeListeners();
      },
    });
  }

  // path [a, b, ..., n] will emit
  // merge(ownListener[root], ownListener[a], ownListener[b], ..., subtreeListener[n])
  emit(path, data) {
    const listenersToMerge = [[]];
    this.__traverse({
      path,
      callbackAtBottom: (node, index) => {
        // if emit an empty path, there is no subtree
        if (index >= path.length) {
          listenersToMerge.push(node.subtreeListeners);
        }
      },
      callbackAfterRecursion: node => {
        if (Object.keys(node.ownListeners).length) {
          listenersToMerge.push(node.ownListeners);
        }
      },
    });
    const listeners = Object.assign(...listenersToMerge);
    for (const listenerId in listeners) {
      const listener = listeners[listenerId];
      // prevent to call if listener is off while emit
      if (listener !== undefined) {
        listener(data);
      }
    }
  }

  on(path, listener) {
    return this.addListener(path, listener);
  }

  off(path, listener) {
    this.removeListener(path, listener);
  }

  offAll(listener) {
    this.removeAllListeners(listener);
  }
}
