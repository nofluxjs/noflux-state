export const normalizePath = (path) => {
  if (Array.isArray(path)) {
    return path;
  } else if (typeof path === 'string') {
    return path.split('.').filter(subPath => subPath.length);
  } else {
    throw Error(`State.prototype.cursor only accept string or array, ${typeof path} is forbidden`);
  }
}

// only null and undefined has no properties
// ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/No_properties
export const hasNoProperties = obj => obj === undefined || obj === null;

export const getIn = (obj, path) => {
  let pointer = obj;
  for (const next of path) {
    if (hasNoProperties(pointer)) {
      return undefined;
    }
    pointer = pointer[next];
  }
  return pointer;
}

export const isObject = obj => typeof obj === 'object' && obj !== null;
export const isNumeric = num => !isNaN(num) && num !== '';

export const shallowClone = (obj, path = '') => {
  if (Array.isArray(obj)) {
    return [...obj];
  } else if (isObject(obj)) {
    return {...obj};
  }
  if (isNumeric(path)) {
    return [];
  } else {
    return {};
  }
};

export const setIn = (obj = {}, path, value) => {
  const [first, ...rest] = path;

  let newObj = shallowClone(obj);
  let parentPointer = newObj;
  let lastNext = first;
  let pointer = obj[first];

  for (const next of rest) {
    parentPointer[lastNext] = shallowClone(pointer, next);
    parentPointer = parentPointer[lastNext];
    lastNext = next;
    if (hasNoProperties(pointer)) {
      // always skip traversing null or undefined
      pointer = null;
      continue;
    } else {
      pointer = pointer[next];
    }
  }
  parentPointer[lastNext] = value;
  return newObj;
};