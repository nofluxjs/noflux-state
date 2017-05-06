import test from 'ava';
import ListenerTree, { getListenerId } from '../src/listener-tree';

test('getListenerId', t => {
  const callback = () => {};
  t.falsy(getListenerId(callback));
  const listenerId = getListenerId(callback, true);
  t.truthy(listenerId);
  t.is(getListenerId(callback), listenerId);
});

test('trig on parent node emit', t => {
  const event = new ListenerTree();
  const emitPath = ['a'];
  const emitValue = {};
  let callCount = 0;
  const callback = value => {
    t.is(value, emitValue);
    callCount += 1;
  };
  event.on(['a', 'b'], callback);
  event.on(['a', 'c'], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 1);
});

test('trig on parent node emit when parent is root', t => {
  const event = new ListenerTree();
  const emitPath = [];
  const emitValue = {};
  let callCount = 0;
  const callback = value => {
    t.is(value, emitValue);
    callCount += 1;
  };
  event.on(['a'], callback);
  event.on(['b'], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 1);
});

test('trig on child nodes emit', t => {
  const event = new ListenerTree();
  const emitPath = ['a', 'b'];
  const emitValue = {};
  let callCount = 0;
  const callback = value => {
    t.is(value, emitValue);
    callCount += 1;
  };
  event.on(['a'], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 1);
});


test('trig on child nodes emit when listen to root', t => {
  const event = new ListenerTree();
  const emitPath = ['a', 'b'];
  const emitValue = {};
  let callCount = 0;
  const callback = value => {
    t.is(value, emitValue);
    callCount += 1;
  };
  event.on([], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 1);
});

test('callback unique', t => {
  const event = new ListenerTree();
  const emitPath = ['a', 'b'];
  const emitValue = {};
  let call1Count = 0;
  const callback1 = value => {
    t.is(value, emitValue);
    call1Count += 1;
  };
  let call2Count = 0;
  const callback2 = value => {
    t.is(value, emitValue);
    call2Count += 1;
  };
  event.on([], callback1);
  event.on(['a'], callback1);
  event.on(['a'], callback2);
  event.emit(emitPath, emitValue);
  t.is(call1Count, 1);
  t.is(call2Count, 1);
});

test('not trig on different path', t => {
  const event = new ListenerTree();
  const emitPath = ['b'];
  const emitValue = {};
  const callback = () => t.fail('should not be called');
  event.on(['a'], callback);
  event.emit(emitPath, emitValue);
});

test('off worked', t => {
  const event = new ListenerTree();
  const emitPath = ['a', 'b'];
  const emitValue = {};
  let callCount = 0;
  const callback = value => {
    t.is(value, emitValue);
    callCount += 1;
  };
  event.on(['a'], callback);
  event.on(['a'], callback);
  event.on(['a', 'b'], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 1);

  event.off(['a'], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 2);

  event.off(['a'], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 3);

  // off wrong path will be ignore
  event.off(['a'], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 4);

  event.off(['a', 'b'], callback);
  event.emit(emitPath, emitValue);
  t.is(callCount, 4); // worked

  event.on(['d'], () => {});
  event.emit(emitPath, emitValue);
  t.is(callCount, 4);
});
