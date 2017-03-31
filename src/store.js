import { getByPath } from './utils';

export default class Store {

  constructor() {
    this._data = undefined;
  }

  read(path) {
    return getByPath(this._data, path);
  }

  write(path, value) {
    return;
  }
}