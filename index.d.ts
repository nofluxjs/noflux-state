type Path = string | string[];

type Message = 'get' | 'set';

export declare class State {
  get(path?: Path): any
  set(value: any): any
  set(path: Path, value: any): any
  cursor(path: Path): State
  on(message: Message, callback: (data: any) => void): void
  addEventListener(message: Message, callback: (data: any) => void): void
  off(message: Message, callback: (data: any) => void): void
  removeEventListener(message: Message, callback: (data: any) => void): void
  snapshot(): void
  canUndo(): boolean
  undo(): void
  canRedo(): boolean
  redo(): void
  push(...values: any[]): void
  pop(): void
  unshift(...values: any[]): void
  shift(): void
  fill(value: any): void
  reverse(): void
  splice(...values: any[]): void
}
