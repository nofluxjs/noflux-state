import { getByPath, setByPath } from './utils';

export default class Store {

  constructor(data) {
    this.__data = data;
  }

  read(path) {
    return getByPath(this.__data, path);
  }

  write(path, value) {
    this.__data = setByPath(this.__data, path, value);
  }
}
