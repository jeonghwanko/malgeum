export function withScope(fn: (scope: any) => void) {
  fn({ setTag: jest.fn() });
}
export function captureException(_e: unknown) {}
export function captureMessage(_msg: string, _level?: string) {}
export function init(_opts: any) {}
export function wrap<T>(component: T): T { return component; }
