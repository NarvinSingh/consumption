import { mix } from './utils.mjs';
import observable from './observable.mjs';

const cleanup = (Superclass = Object) => class Cleanup extends Superclass {
  constructor(
    isRerunnable = false,
    signals = ['SIGINT', 'SIGQUIT', 'SIGTERM'],
    signalExitCode,
    ...superArgs
  ) {
    super(...superArgs);
    this.isRerunnable = isRerunnable;
    this.signals = signals;
    this.handleSignal = (signal) => { this.run(signal, signalExitCode); };
    this.signals.forEach((signal) => { process.on(signal, this.handleSignal); });
    this.callbacks = [];
  }

  addCallbacks(...callbacks) {
    if (!this.isRerunnable && this.lastRunResult) return; // run once guard
    this.callbacks.push(...callbacks.flat());
  }

  run(signal, exitCode) {
    // run once guard
    if (!this.isRerunnable && this.lastRunResult) return this.lastRunResult;

    // run
    this.notifyObservers(`${signal} received`);
    this.lastRunResult = Promise.all(this.callbacks.map((callback) => callback(signal)));

    // remove process listeners and cleanup if won't be running again
    if (!this.isRerunnable) {
      this.signals.forEach((sig) => process.removeListener(sig, this.handleSignal));
      this.signals = null;
      this.callbacks = null;
    }

    // exitCode argument indicates we should exit the process
    if (exitCode !== undefined) {
      this.lastRunResult.finally(() => {
        this.notifyObservers(`App will exit with code ${exitCode}`);
        process.exit(exitCode);
      });
    }

    return this.lastRunResult;
  }
};

export function makeCleanup(base = Object) {
  return mix(base, observable, cleanup);
}

export default makeCleanup();
