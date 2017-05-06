import test from 'ava';
import {
  escapePath,
  unescapePath,
  parsePath,
  stringifyPath,
  isNullOrUndefined,
  getByPath,
  setByPath,
  arrayFromAllowNullOrUndefined,
  removeFirstFromArray,
} from '../src/utils';

const deepClone = x => JSON.parse(JSON.stringify(x));

const testPath = {
  '': [],
  a: ['a'],
  'a.b': ['a', 'b'],
  'a.b.c': ['a', 'b', 'c'],
  'a~0b': ['a.b'],
  'a~1b': ['a~b'],
};

test('escapePath', t => {
  t.deepEqual(escapePath('a'), 'a');
  t.deepEqual(escapePath('a.b'), 'a~0b');
  t.deepEqual(escapePath('a~b'), 'a~1b');
});

test('unescapePath', t => {
  t.deepEqual(unescapePath('a'), 'a');
  t.deepEqual(unescapePath('a~0b'), 'a.b');
  t.deepEqual(unescapePath('a~1b'), 'a~b');
});

test('parsePath', t => {
  for (const pathStr of Object.keys(testPath)) {
    const pathArray = testPath[pathStr];
    t.deepEqual(parsePath(pathStr), pathArray);
  }
  t.throws(() => parsePath(null));
});

test('stringifyPath', t => {
  for (const pathStr of Object.keys(testPath)) {
    const pathArray = testPath[pathStr];
    t.deepEqual(stringifyPath(pathArray), pathStr);
  }
  t.throws(() => stringifyPath(null));
});

test('parsePath and stringifyPath', t => {
  for (const pathStr of Object.keys(testPath)) {
    const pathArray = testPath[pathStr];
    t.deepEqual(parsePath(stringifyPath(pathArray)), pathArray);
    t.deepEqual(stringifyPath(stringifyPath(pathStr)), pathStr);
  }
});

test('isNullOrUndefined', t => {
  t.is(isNullOrUndefined(null), true);
  t.is(isNullOrUndefined(undefined), true);
  t.is(isNullOrUndefined(NaN), false);
  t.is(isNullOrUndefined(false), false);
  t.is(isNullOrUndefined(0), false);
});

test('getByPath', t => {
  const obj = {
    a: 1,
    b: {
      c: 2,
    },
    d: ['e', 'f', { g: 3 }],
    e: null,
    f: NaN,
  };
  t.is(getByPath(obj, []), obj);
  t.is(getByPath(obj, ['a']), obj.a);
  t.is(getByPath(obj, ['b']), obj.b);
  t.is(getByPath(obj, ['b', 'c']), obj.b.c);
  t.is(getByPath(obj, ['d']), obj.d);
  t.is(getByPath(obj, ['d', '2']), obj.d[2]);
  t.is(getByPath(obj, ['e']), null);
  t.true(Number.isNaN(getByPath(obj, ['f'])));
});

test('setByPath normal', t => {
  const obj = {
    a: {
      b: {
        c: 1,
      },
    },
    d: {
      e: {
        f: 2,
      },
    },
  };

  const cloneObj = deepClone(obj);
  const newObj = setByPath(obj, ['a', 'b', 'c'], 2);
  t.deepEqual(obj, cloneObj);

  cloneObj.a.b.c = 2;
  t.deepEqual(newObj, cloneObj);
  t.not(obj, newObj);
});

test('setByPath copy-on-write', t => {
  const obj = {
    a: {
      b: {
        d: 1,
        e: 2,
      },
      c: {
        f: 3,
        g: 4,
      },
    },
  };

  const cloneObj = deepClone(obj);
  const newObj = setByPath(obj, ['a', 'b'], 2);
  t.deepEqual(obj, cloneObj);

  cloneObj.a.b = 2;
  t.deepEqual(newObj, cloneObj);
  t.not(obj.a, newObj.a);
  t.is(obj.a.c, newObj.a.c);
});

test('setByPath Array', t => {
  const obj = [0, 1, { a: 2, b: { c: 3 } }, { d: 4 }];

  const cloneObj = deepClone(obj);
  const newObj = setByPath(obj, ['2', 'b', 'c'], 3);
  t.deepEqual(obj, cloneObj);

  cloneObj[2].b.c = 3;
  t.deepEqual(newObj, cloneObj);
  t.is(obj[3], newObj[3]);
});

test('setByPath bad state', t => {
  const path = ['a', 'b', 'c'];
  const value = 1;
  const result = { a: { b: { c: 1 } } };
  t.deepEqual(setByPath(null, path, value), result);
  t.deepEqual(setByPath(undefined, path, value), result);
  t.deepEqual(setByPath(1, path, value), result);
  t.deepEqual(setByPath('2', path, value), result);
  t.deepEqual(setByPath(() => {}, path, value), result);
  t.deepEqual(setByPath(Symbol('foo'), path, value), result);
});

test('setByPath auto detect by path', t => {
  const obj = {
    a: 1,
  };

  const cloneObj = deepClone(obj);
  const newObj = setByPath(obj, ['b', '2', 'c'], 3);
  t.deepEqual(obj, cloneObj);

  cloneObj.b = [undefined, undefined, { c: 3 }];
  t.deepEqual(newObj, cloneObj);
});

test('arrayFromAllowNullOrUndefined works', t => {
  t.deepEqual(arrayFromAllowNullOrUndefined(null), []);
  t.deepEqual(arrayFromAllowNullOrUndefined(undefined), []);
  t.deepEqual(arrayFromAllowNullOrUndefined(0), []);
  t.deepEqual(arrayFromAllowNullOrUndefined({}), []);
});

test('removeFirstFromArray', t => {
  const array = [1, 2, 3, 4, 5];
  removeFirstFromArray(array, 3);
  t.deepEqual(array, [1, 2, 4, 5]);
  // remove non-existing value
  removeFirstFromArray(array, 0);
  t.deepEqual(array, [1, 2, 4, 5]);
});
