import { getByPath, setByPath } from './utils';

export default class Store {

  constructor(data) {
    this._data = data;
  }

  read(path) {
    return getByPath(this._data, path);
  }

  write(path, value) {
    this._data = setByPath(this._data, path, value);
  }
}