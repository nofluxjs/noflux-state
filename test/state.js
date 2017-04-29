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
  const handler = state.on('change', () => t.pass());
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
  state.on('change', callback);
  // should emit
  state.set('', 1);
  state.set('a', 1);
  state.set('a.b', 1);
  state.set('c.d', 1);
  // remove listener
  state.off('change', callback);
  state.set('', 1);
  setTimeout(() => {
    t.end();
  }, TEST_TIMEOUT);
});

test.cb('event emit with cursor', t => {
  t.plan(4);
  const state = new State();
  state.cursor('a').on('change', () => t.pass());
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
  state.cursor('a').on('change', () => t.pass());
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
  state.cursor(['a.b']).on('change', () => t.pass());
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

test('immutable Array operators', t => {
  const state = new State();
  state.set({
    array: [1, 2, 3],
  });
  t.deepEqual(state.get('array'), [1, 2, 3]);
  state.push('array', 4, 5);
  t.deepEqual(state.get('array'), [1, 2, 3, 4, 5]);
  state.pop('array');
  t.deepEqual(state.get('array'), [1, 2, 3, 4]);
  state.unshift('array', -1, 0);
  t.deepEqual(state.get('array'), [-1, 0, 1, 2, 3, 4]);
  state.shift('array');
  t.deepEqual(state.get('array'), [0, 1, 2, 3, 4]);
  state.reverse('array');
  t.deepEqual(state.get('array'), [4, 3, 2, 1, 0]);
  state.splice('array', 2, 1, 'a');
  t.deepEqual(state.get('array'), [4, 3, 'a', 1, 0]);
  state.fill('array', 0);
  t.deepEqual(state.get('array'), [0, 0, 0, 0, 0]);
});
