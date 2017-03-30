import test from 'ava';
import State from '../src';

test('foo', t => {
  const state = new State();
	t.is(state.test, 1);
});