import test from 'ava';
import { normalizePath, hasNoProperties, getIn } from '../src/utils';

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