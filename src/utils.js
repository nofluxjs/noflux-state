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
  for (const [index, next] of path.entries()) {
    pointer = pointer[next];
    if (index === path.length - 1) {
      return pointer;
    }
    if (hasNoProperties(pointer)) {
      return undefined;
    }
  }
  return pointer;
}