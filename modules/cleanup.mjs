import { mix } from './utils.mjs';
import observable from './observable.mjs';

const cleanup = (Superclass = Object) => class Cleanup extends Superclass {
  constructor(signals = ['SIGINT', 'SIGQUIT', 'SIGTERM'], ...rest) {
    super();
    this.signals = [signals].flat().concat(rest);
    this.callbacks = [];
    this.handleSignal = (signal) => { this.runOnce(signal, 0); };
    this.signals.forEach((signal) => { process.on(signal, this.handleSignal); });
  }

  addCallbacks(...callbacks) {
    this.callbacks.push(...callbacks.flat());
  }

  run(signal, exitCode) {
    this.notifyObservers(`${signal} received`);
    this.lastRunResult = Promise.all(this.callbacks.map((callback) => callback(signal)));
    this.lastRunResult.finally(() => {
      this.signals.forEach((sig) => process.removeListener(sig, this.handleSignal));
      if (exitCode !== undefined) {
        this.notifyObservers('App will exit now');
        process.exit(exitCode);
      }
    });

    return this.lastRunResult;
  }

  runOnce(signal, exitCode) {
    return this.lastRunResult || this.run(signal, exitCode);
  }
};

export function makeCleanup(base = Object) {
  return mix(base, observable, cleanup);
}

export default makeCleanup();
