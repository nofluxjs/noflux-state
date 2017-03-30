import test from 'ava';
import Store from '../src/store';

test('read', t => {
  const store = new Store();
  // force change store._data
  store._data = {
    a: {
      b: [{
        c: 1,
      }]
    },
    d: null,
    e: undefined,
    f: NaN,
  };
  t.is(store.read(['a']), store._data.a);
  t.is(store.read(['a', 'b']), store._data.a.b);
  t.is(store.read(['a', 'b', '0', 'c']), store._data.a.b[0].c);
  t.is(store.read(['d']), null);
  t.is(store.read(['e']), undefined);
  t.true(Number.isNaN(store.read(['f'])));
});