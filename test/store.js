import test from 'ava';
import Store from '../src/store';

const deepClone = x => JSON.parse(JSON.stringify(x));

test('read', t => {
  const data = {
    a: {
      b: [{
        c: 1,
      }],
    },
    d: null,
    e: undefined,
    f: NaN,
  };
  const store = new Store(data);
  t.deepEqual(store.read([]), data);
  t.deepEqual(store.read(['a']), data.a);
  t.deepEqual(store.read(['a', 'b']), data.a.b);
  t.deepEqual(store.read(['a', 'b', '0', 'c']), data.a.b[0].c);
  t.deepEqual(store.read(['d']), null);
  t.deepEqual(store.read(['e']), undefined);
  t.true(Number.isNaN(store.read(['f'])));
  t.is(store.read(['notFount']), undefined);
});

test('write', t => {
  const data1 = {
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
  const store = new Store(data1);
  const result1 = store.read([]);
  t.is(result1, data1);


  store.write(['a', 'b', 'h'], 2);
  const data2 = deepClone(data1);
  data2.a.b.h = 2;
  const result2 = store.read([]);
  t.deepEqual(result2, data2);

  t.not(result2.a.b, data1.a.b);
  t.is(result2.a.c, data1.a.c);
});

test('write empty', t => {
  const store = new Store();
  t.is(store.read([]), undefined);
  const data = { a: 1 };
  store.write([], data);
  t.deepEqual(store.read([]), data);
});
