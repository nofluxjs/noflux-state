export const SYMBOL_NOFLUX = '__noflux';

/*
 * JSON Pointer style escape
 * http://tools.ietf.org/html/rfc6901
 */
export const escapePath = path => path.replace(/~/g, '~1').replace(/\./g, '~0');
export const unescapePath = path => path.replace(/~0/g, '.').replace(/~1/g, '~');

export const parsePath = path => {
  if (Array.isArray(path)) {
    return path;
  }
  if (typeof path === 'string') {
    if (!path.length) {
      return [];
    }
    // path with dot, e.g. 'a~1b.c' => ['a.b', 'c']
    if (path.indexOf('~') !== -1) {
      return path.split('.').map(unescapePath);
    }
    return path.split('.');
  }
  throw Error(`State.prototype.cursor only accept string or array, ${typeof path} is forbidden`);
};

export const stringifyPath = path => {
  if (typeof path === 'string') {
    return path;
  }
  if (Array.isArray(path)) {
    // path with dot, e.g. ['a.b', 'c'] => 'a~1b.c'
    return path.map(escapePath).join('.');
  }
  throw Error(`State.prototype.cursor only accept string or array, ${typeof path} is forbidden`);
};

export const isNullOrUndefined = obj => obj === undefined || obj === null;

export const getByPath = (obj, path) => {
  let pointer = obj;
  for (let i = 0; i < path.length; i++) {
    const next = path[i];
    // only null and undefined has no properties
    // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/No_properties
    if (isNullOrUndefined(pointer)) {
      return undefined;
    }
    pointer = pointer[next];
  }
  return pointer;
};

export const isObject = obj => typeof obj === 'object' && obj !== null;
export const isNumeric = num => !isNaN(num) && num !== '';

export const shallowClone = (obj, path = '') => {
  if (Array.isArray(obj)) {
    return [...obj];
  } else if (isObject(obj)) {
    return { ...obj };
  }
  if (isNumeric(path)) {
    return [];
  } else {
    return {};
  }
};

const HEAD = 'HEAD';
export const setByPath = (obj, path = [], value) => {
  if (!path.length) {
    return value;
  }

  const root = {};
  root[HEAD] = obj;
  let parentPointer = root;
  let lastNext = HEAD;
  let pointer = obj;
  for (let i = 0; i < path.length; i++) {
    const next = path[i];
    parentPointer[lastNext] = shallowClone(pointer, next);
    parentPointer = parentPointer[lastNext];
    lastNext = next;
    if (isNullOrUndefined(pointer)) {
      // always skip traversing null or undefined
      pointer = null;
    } else {
      pointer = pointer[next];
    }
  }
  parentPointer[lastNext] = value;
  return root[HEAD];
};

// null or undefined will cause an error
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
export const arrayFromAllowNullOrUndefined = arrayLike => (
  isNullOrUndefined(arrayLike) ? [] : [...arrayLike]
);

let count = 1;
export const getNextId = () => {
  count += 1;
  return count;
};
