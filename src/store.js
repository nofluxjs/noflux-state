import { getByPath, setByPath } from './utils';

export default class Store {
  constructor({
    data,
    // FIXME: export api for changing this value
    maxSnapshots = Infinity,
  } = {}) {
    this.__data = data;
    this.__maxSnapshots = maxSnapshots;
    this.__snapshots = [];
    this.__snapshotIndex = -1;
  }

  read(path) {
    return getByPath(this.__data, path);
  }

  write(path, value) {
    this.__data = setByPath(this.__data, path, value);
  }

  snapshot() {
    this.__snapshotIndex += 1;
    this.__snapshots[this.__snapshotIndex] = this.__data;
    // override redid snapshots
    this.__snapshots.length = this.__snapshotIndex + 1;
    if (this.__snapshots.length > this.maxSnapshots) {
      this.__snapshots.shift();
      this.__snapshotIndex -= 1;
    }
  }

  canUndo() {
    return this.__snapshotIndex > 0;
  }

  undo() {
    if (!this.canUndo()) {
      throw new RangeError('no more snapshot available');
    }
    this.__snapshotIndex -= 1;
    this.__data = this.__snapshots[this.__snapshotIndex];
  }

  canRedo() {
    return this.__snapshotIndex + 1 < this.__snapshots.length;
  }

  redo() {
    if (!this.canRedo()) {
      throw new RangeError('no more snapshot available');
    }
    this.__snapshotIndex += 1;
    this.__data = this.__snapshots[this.__snapshotIndex];
  }
}
