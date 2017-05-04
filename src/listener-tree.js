import {
  SYMBOL_NOFLUX,
  getNextId,
  removeFirstFromArray,
} from '../src/utils';

// reduce property get times will accelerate 10%~15%
const SYMBOL_NOFLUX_ID = `${SYMBOL_NOFLUX}_id`;

export const getListenerId = (listener, autoGenerate = false) => {
  // unique id for each listener
  if (autoGenerate && listener[SYMBOL_NOFLUX_ID] === undefined) {
    Object.defineProperty(listener, SYMBOL_NOFLUX_ID, {
      enumerable: false,
      writable: true,
      configurable: true,
      value: getNextId(),
    });
  }
  return listener[SYMBOL_NOFLUX_ID];
};

/*
 * for performance hit, every node maintain ownListeners and subtreeListeners
 * ownListeners[listenerId] = listener on current path
 * subtreeListeners[listenerId] = merge(
 *   ownListeners[listenerId],
 *   children.every.subtreeListeners[listenerId],
 * )
 */
export class ListenerTreeNode {
  children = {};
  subtreeListeners = [];
  ownListeners = [];
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
    let pointer = this.__tree;
    // save call stack for backtracking
    const stack = [];
    stack.push(pointer);
    for (let index = 0; index <= path.length; index += 1) {
      const isAtBottom = index === path.length
        || (!createEmptyPath && pointer.children[path[index]] === undefined);
      if (isAtBottom && callbackAtBottom) {
        callbackAtBottom(pointer, index);
        break;
      }
      if (callbackBeforeRecursion) {
        callbackBeforeRecursion(pointer);
      }
      const child = path[index];
      if (pointer.children[child] === undefined) {
        pointer.children[child] = new ListenerTreeNode();
      }
      pointer = pointer.children[child];
      stack.push(pointer);
    }
    if (callbackAfterRecursion) {
      while (stack.length) {
        pointer = stack.pop();
        callbackAfterRecursion(pointer);
      }
    }
  }

  addListener(path, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('"listener" argument must be a function');
    }
    // init listener id
    getListenerId(listener, true);
    this.__traverse({
      path,
      createEmptyPath: true,
      callbackAfterRecursion: node => node.subtreeListeners.push(listener),
      callbackAtBottom: node => node.ownListeners.push(listener),
    });
    return () => {
      this.removeListener(path, listener);
    };
  }

  removeListener(path, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('"listener" argument must be a function');
    }
    this.__traverse({
      path,
      callbackAfterRecursion: node => removeFirstFromArray(node.subtreeListeners, listener),
      callbackAtBottom: node => removeFirstFromArray(node.ownListeners, listener),
    });
  }

  // path [a, b, ..., n] will emit
  // merge(ownListener[root], ownListener[a], ownListener[b], ..., subtreeListener[n])
  emit(path, data) {
    const listeners = [];
    this.__traverse({
      path,
      callbackAtBottom: (node, index) => {
        // if emit an empty path, there is no subtree
        if (index === path.length) {
          listeners.push(...node.subtreeListeners);
        }
      },
      callbackAfterRecursion: node => {
        if (node.ownListeners.length) {
          listeners.push(...node.ownListeners);
        }
      },
    });
    const called = {};
    for (let index = 0; index < listeners.length; index += 1) {
      const listener = listeners[index];
      const listenerId = getListenerId(listener);
      // same listener will call once
      if (!called[listenerId]) {
        called[listenerId] = true;
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
}
