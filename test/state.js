import test from 'ava';
import { Observable } from 'rxjs/Rx';
import State from '../src/state';

const OBSERVABLE_TIMEOUT = 100;

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

test('event emit', t => {
  t.plan(4);
  const state = new State();
  process.nextTick(() => {
    // should emit
    state.set('', 1);
    state.set('a', 1);
    state.set('a.b', 1);
    // should not emit
    state.set('c.d', 1);
  });
  return Observable
    .from(state.listen('change'))
    .map(() => t.pass())
    .timeoutWith(OBSERVABLE_TIMEOUT, Observable.empty());
});

test('event emit with cursor', t => {
  t.plan(4);
  const state = new State();
  process.nextTick(() => {
    // should emit
    state.set('', 1);
    state.set('a', 1);
    state.cursor('a').set('c', 1);
    // should not emit
    state.set('a.b', 1);
    state.set('c.d', 1);
  });
  return Observable
    .from(state.cursor('a').listen('change'))
    .map(() => t.pass())
    .timeoutWith(OBSERVABLE_TIMEOUT, Observable.empty());
});
