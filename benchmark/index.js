/* eslint no-console: "off" */
import { Suite } from 'benchmark';

import ListenersTree from '../src/listener-tree';
import RecursionListenerTree from './recursion-listener-tree';
import HashListenerTree from './hash-listener-tree';

const listenerTree = new ListenersTree();
const recursionListenerTree = new RecursionListenerTree();
const hashListenerTree = new HashListenerTree();

const run = event => {
  const cb = () => {
    // for (let i = 0; i < 10; i++);
  };
  event.on(['a', 'b'], cb);
  event.on(['a', 'b', 'c'], cb);
  event.on(['a', 'b', 'd'], cb);
  event.on(['a', 'b', 'f'], cb);
  event.on(['a', 'b', 'h'], cb);
  event.on(['a'], cb);
  for (let i = 0; i < 100; i++) {
    event.emit(['a']);
    event.emit(['b']);
    event.emit(['a', 'b']);
    event.emit([]);
    event.emit(['a', 'b', 'h']);
  }
  event.off(['a', 'b'], cb);
  event.off(['a', 'b', 'c'], cb);
  event.off(['a', 'b', 'd'], cb);
  event.off(['a', 'b', 'f'], cb);
  event.off(['a', 'b', 'h'], cb);
  event.off(['a'], cb);
};

const suite = new Suite();
suite
  .add('ListenersTree', () => {
    run(listenerTree);
  })
  .add('RecursionListenerTree', () => {
    run(recursionListenerTree);
  })
  .add('HashListenerTree', () => {
    run(hashListenerTree);
  })
  .on('cycle', event => {
    console.log(String(event.target));
  })
  .on('complete', function complete() {
    console.log(`Fastest is ${this.filter('fastest').map('name')}`);
  })
  .run({ async: true });
// const suite = new Suite();
// suite
//   .add('object', () => {
//     const a = {};
//     for (let i = 0; i < 10000; i++) {
//       a[i] = true;
//     }
//   })
//   .add('array', () => {
//     const a = [];
//     for (let i = 0; i < 10000; i++) {
//       a.push(true);
//     }
//   })
//   .on('cycle', event => {
//     console.log(String(event.target));
//   })
//   .on('complete', function complete() {
//     console.log(`Fastest is ${this.filter('fastest').map('name')}`);
//   })
//   .run({ async: true });
