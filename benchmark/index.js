/* eslint no-console: "off" */
import { Suite } from 'benchmark';

import ListenersTree from '../src/listener-tree';
import HashListenerTree from './hash-listener-tree';

const listenerTree = new ListenersTree();
const hashListenerTree = new HashListenerTree();

const work = () => {
  let i = 10;
  while(i--);
}
const run = event => {
  const cb = () => { work(); };
  event.on(['a', 'b'], cb);
  event.on(['a', 'b', 'c'], cb);
  event.on(['a', 'b', 'd'], cb);
  event.on(['a', 'b', 'f'], cb);
  event.on(['a', 'b', 'h'], cb);
  event.on(['a'], cb);
  event.emit(['a']);
  event.emit(['b']);
  event.emit(['a', 'b']);
  event.emit([]);
  event.emit(['a', 'b', 'h']);
  event.off(['a', 'b'], cb);
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
