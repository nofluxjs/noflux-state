/* eslint no-console: "off" */
import { Suite } from 'benchmark';

import ListenersTree from '../src/listener-tree';
import HashListenerTree from './hash-listener-tree';

const listenerTree = new ListenersTree();
const hashListenerTree = new HashListenerTree();

const cb1 = () => {};
const cb2 = () => {};
const cb3 = () => {};
const cb4 = () => {};
const cb5 = () => {};
const cb6 = () => {};
const run = event => {
  event.on(['a', 'b'], cb1);
  event.on(['a', 'b', 'c'], cb2);
  event.on(['a', 'b', 'd'], cb3);
  event.on(['a', 'b', 'f'], cb4);
  event.on(['a', 'b', 'h'], cb5);
  event.on(['a'], cb6);
  event.emit(['a']);
  event.emit(['b']);
  event.emit(['a', 'b']);
  event.emit([]);
  event.emit(['a', 'b', 'h']);
  event.off(['a', 'b'], cb1);
};

const suite = new Suite();
suite
  .add('ListenersTree', () => {
    run(listenerTree);
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
