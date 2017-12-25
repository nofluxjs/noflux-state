import test from 'ava';
import State from '../src/state';

const TEST_TIMEOUT = 100;

test('get and set', t => {
  const state = new State();
  state.set('a.b', { c: { d: 1 } });

  t.deepEqual(state.get(), { a: { b: { c: { d: 1 } } } });
  t.deepEqual(state.get(''), { a: { b: { c: { d: 1 } } } });
  t.deepEqual(state.get('a'), { b: { c: { d: 1 } } });
  t.deepEqual(state.get('a.b'), { c: { d: 1 } });
  t.deepEqual(state.get('a.b.c'), { d: 1 });
  t.deepEqual(state.get('a.b.c.d'), 1);
});

test('update', t => {
  const state = new State();
  state.set({ a: { b: 1, c: 2 }, d: [{ e: 3 }, 4] });

  // Object
  state.update('a', obj => ({
    ...obj,
    f: 5,
  }));
  t.deepEqual(state.get(), { a: { b: 1, c: 2, f: 5 }, d: [{ e: 3 }, 4] });

  // Array
  state.update('d', arr => [6, ...arr, {}]);
  t.deepEqual(state.get(), { a: { b: 1, c: 2, f: 5 }, d: [6, { e: 3 }, 4, {}] });
});

test('undefined', t => {
  const state = new State();
  t.is(state.get(), undefined);
  t.is(state.get('not.fount'), undefined);
});

test('cursor get', t => {
  const state = new State();
  state.set({
    a: {
      b: {
        c: 1,
      },
    },
  });
  t.is(state.cursor().get(), state.get());
  t.is(state.cursor('a').get(), state.get('a'));
  t.is(state.cursor('a').get('b'), state.get('a.b'));
  t.is(state.cursor('a').cursor('b').get(), state.get('a.b'));
  t.true(state.cursor('a') instanceof State);
});

test('cursor set', t => {
  const state = new State();
  const cursorState = state.cursor('a').cursor('b');
  cursorState.set({ c: { d: 1 } });
  cursorState.set('c.e', 2);
  t.deepEqual(state.get(), { a: { b: { c: { d: 1, e: 2 } } } });
});

test.cb('event listen and cancel', t => {
  t.plan(4);
  const state = new State();
  const handler = state.on('set', () => t.pass());
  // should emit
  state.set('', 1);
  state.set('a', 1);
  state.set('a.b', 1);
  state.set('c.d', 1);
  // remove listener
  handler();
  state.set('', 1);
  setTimeout(() => {
    t.end();
  }, TEST_TIMEOUT);
});

test.cb('event listen and off', t => {
  t.plan(4);
  const state = new State();
  const callback = () => t.pass();
  state.on('set', callback);
  // should emit
  state.set('', 1);
  state.set('a', 1);
  state.set('a.b', 1);
  state.set('c.d', 1);
  // remove listener
  state.off('set', callback);
  state.set('', 1);
  setTimeout(() => {
    t.end();
  }, TEST_TIMEOUT);
});

test.cb('event emit with cursor', t => {
  t.plan(4);
  const state = new State();
  state.cursor('a').on('set', () => t.pass());
  // should emit
  state.set('', 1);
  state.set('a', 1);
  state.set('a.b', 1);
  state.cursor('a').set('c', 1);
  // should not emit
  state.set('c.d', 1);
  setTimeout(() => {
    t.end();
  }, TEST_TIMEOUT);
});

test.cb('set path with dot', t => {
  t.plan(5);
  const state = new State();
  state.cursor('a').on('set', () => t.pass());
  // should emit
  state.set('', 1);
  state.set('a', 1);
  state.set('a.b', 1);
  state.cursor('a').set('c', 1);
  state.set(['a', 'b.c'], 1);
  // should not emit
  state.set(['a.d'], 1);
  state.set(['a.e', 'f'], 1);
  setTimeout(() => {
    t.end();
  }, TEST_TIMEOUT);
});

test.cb('listen path with dot', t => {
  t.plan(3);
  const state = new State();
  state.cursor(['a.b']).on('set', () => t.pass());
  // should emit
  state.set('', 1);
  state.set(['a.b'], 1);
  state.set(['a.b', 'c'], 1);
  // should not emit
  state.set('a', 1);
  state.set('a.b', 1);
  setTimeout(() => {
    t.end();
  }, TEST_TIMEOUT);
});

test.cb('get event works', t => {
  t.plan(4);
  const state = new State();
  state.on('get', () => t.pass());
  state.set('a.b', 1);
  // will emit
  state.get('');
  state.get('a');
  state.get('a.b');
  state.get('a.c');
  setTimeout(() => {
    t.end();
  }, TEST_TIMEOUT);
});

test('snapshot data', t => {
  const state = new State();

  state.set('a.b.c', 1);
  const data1 = state.get();
  state.snapshot();

  state.set('a.e.d', 2);
  const data2 = state.get();
  state.snapshot();

  // won't be snapshotted
  state.set('a.f.g', 3);

  // undo(data1)
  t.is(state.canUndo(), true);
  state.undo();
  t.is(state.get(), data1);

  t.is(state.canUndo(), false);

  // redo(data2)
  t.is(state.canRedo(), true);
  state.redo();
  t.is(state.get(), data2);

  t.is(state.canRedo(), false);
});

test.cb('undo & redo should emit set event', t => {
  t.plan(2);
  const state = new State();

  state.set('a.b.c', 1);
  state.snapshot();
  state.set('a.e.d', 2);
  state.snapshot();
  state.set('a.f.g', 3);

  state.on('set', () => t.pass());
  state.undo();
  state.redo();

  setTimeout(() => {
    t.end();
  }, TEST_TIMEOUT);
});

test('Array operators worked', t => {
  const state = new State();
  state.set({
    array: [1, 2, 3],
  });
  const cursor = state.cursor('array');
  t.deepEqual(cursor.get(), [1, 2, 3]);
  cursor.push(4, 5);
  t.deepEqual(cursor.get(), [1, 2, 3, 4, 5]);
  cursor.pop();
  t.deepEqual(cursor.get(), [1, 2, 3, 4]);
  cursor.unshift(-1, 0);
  t.deepEqual(cursor.get(), [-1, 0, 1, 2, 3, 4]);
  cursor.shift();
  t.deepEqual(cursor.get(), [0, 1, 2, 3, 4]);
  cursor.reverse();
  t.deepEqual(cursor.get(), [4, 3, 2, 1, 0]);
  cursor.splice(2, 1, 'a');
  t.deepEqual(cursor.get(), [4, 3, 'a', 1, 0]);
  cursor.fill(0);
  t.deepEqual(cursor.get(), [0, 0, 0, 0, 0]);
});

test('Array operatoers create shallow clone', t => {
  const state = new State();
  state.set({
    array: [1, 2, { data: 3 }],
  });
  const cursor = state.cursor('array');
  const data1 = cursor.get();
  cursor.push(4, 5);
  const data2 = cursor.get();
  t.not(data1, data2);
  // shallow
  data1[2].data = 33;
  t.is(data2[2].data, 33);
});
