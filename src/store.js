import { getIn } from './utils';

export default class Store {

  constructor() {
    this._data = undefined;
  }

  read(path) {
    return getIn(this._data, path);
  }

  write(path, value) {
    return;
  }
}