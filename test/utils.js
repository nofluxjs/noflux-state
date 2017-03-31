import test from 'ava';
import { normalizePath, hasNoProperties, getIn, setIn } from '../src/utils';

test('normalizePath', t => {
  t.deepEqual(normalizePath(''), []);
  t.deepEqual(normalizePath('a'), ['a']);
  t.deepEqual(normalizePath('a.b'), ['a', 'b']);
  t.deepEqual(normalizePath('a.b.c'), ['a', 'b', 'c']);
  t.deepEqual(normalizePath('a..b'), ['a', 'b']);
  t.throws(() => normalizePath(null));
});

test('hasNoProperties', t => {
  t.is(hasNoProperties(null), true);
  t.is(hasNoProperties(undefined), true);
  t.is(hasNoProperties(NaN), false);
  t.is(hasNoProperties(false), false);
  t.is(hasNoProperties(0), false);
});

test('getIn', t => {
  const obj = {
    a: 1,
    b: {
      c: 2
    },
    d: ['e', 'f', { g: 3 }],
    e: null,
    f: NaN,
  };
  t.is(getIn(obj, []), obj);
  t.is(getIn(obj, ['a']), obj.a);
  t.is(getIn(obj, ['b']), obj.b);
  t.is(getIn(obj, ['b', 'c']), obj.b.c);
  t.is(getIn(obj, ['d']), obj.d);
  t.is(getIn(obj, ['d', '2']), obj.d[2]);
  t.is(getIn(obj, ['e']), null);
  t.true(Number.isNaN(getIn(obj, ['f'])));
});

const deepClone = x => JSON.parse(JSON.stringify(x));

test('setIn normal', t=> {
  const obj = {
    a: {
      b: {
        c: 1,
      }
    },
    d: {
      e: {
        f: 2,
      }
    },
  };

  let cloneObj = deepClone(obj);
  let newObj = setIn(obj, ['a', 'b', 'c'], 2);
  t.deepEqual(obj, cloneObj);

  cloneObj.a.b.c = 2;
  t.deepEqual(newObj, cloneObj);
  t.not(obj, newObj);

});

test('setIn copy-on-write', t=> {
  const obj = {
    a: {
      b: {
        d: 1,
        e: 2
      },
      c: {
        f: 3,
        g: 4,
      }
    },
  };

  let cloneObj = deepClone(obj);
  let newObj = setIn(obj, ['a', 'b'], 2);
  t.deepEqual(obj, cloneObj);

  cloneObj.a.b = 2;
  t.deepEqual(newObj, cloneObj);
  t.not(obj.a, newObj.a);
  t.is(obj.a.c, newObj.a.c);

});

test('setIn Array', t=> {
  const obj = [0, 1, { a: 2, b: { c: 3} }, { d: 4} ];

  let cloneObj = deepClone(obj);
  let newObj = setIn(obj, ['2', 'b', 'c'], 3);
  t.deepEqual(obj, cloneObj);

  cloneObj[2].b.c = 3;
  t.deepEqual(newObj, cloneObj);
  t.is(obj[3], newObj[3]);
});

test('setIn auto detect by path', t=> {
  const obj = {
    a: 1,
  };

  let cloneObj = deepClone(obj);
  let newObj = setIn(obj, ['b', '2', 'c'], 3);
  t.deepEqual(obj, cloneObj);

  cloneObj.b = [undefined, undefined, { c: 3 }];
  t.deepEqual(newObj, cloneObj);
})