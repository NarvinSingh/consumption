import mix from './mix.mjs';
import observable from './observable.mjs';

const cleanup = (Superclass = Object) => class Cleanup extends Superclass {
  constructor(signals = ['SIGINT', 'SIGQUIT', 'SIGTERM'], ...rest) {
    super();
    this.signals = [signals].flat().concat(rest);
    this.callbacks = [];
    this.signals.forEach((signal) => {
      process.on(signal, () => { this.runOnce(signal, 0); });
    });
  }

  addCallbacks(...callbacks) {
    this.callbacks.push(...callbacks.flat());
  }

  run(signal, exitCode) {
    this.notifyObservers(`${signal} received`);
    this.lastRunResult = Promise.all(this.callbacks.map((callback) => callback(signal)));
    this.lastRunResult.finally(() => {
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

export default mix(cleanup, observable);
