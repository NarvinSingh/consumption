import mix from './mix.mjs';
import observable from './observable.mjs';

const cleanup = (Superclass = Object) => class Cleanup extends Superclass {
  constructor(signals = ['SIGINT', 'SIGQUIT', 'SIGTERM'], ...rest) {
    super();
    this.signals = [signals].flat().concat(rest);
    this.callbacks = [];
    this.signals.forEach((signal) => {
      process.on(signal, () => this.runOnce(signal, 0));
    });
  }

  addCallbacks(...callbacks) {
    this.callbacks.push(...callbacks.flat());
  }

  async run(signal, exitCode) {
    this.notifyObservers(`${signal} received`);
    await Promise.all(this.callbacks.map(async (callback) => callback(signal)));

    if (exitCode !== undefined) {
      this.notifyObservers('App will exit now');
      process.exit(exitCode);
    }
  }

  async runOnce(signal, exitCode) {
    if (this.hasRun) return;
    this.hasRun = true;
    await this.run(signal, exitCode);
  }
};

export default mix(cleanup, observable);
