export default class Cleanup {
  constructor(signals = ['SIGINT', 'SIGQUIT', 'SIGTERM'], ...rest) {
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
    console.log(`${signal} received`);
    await Promise.all(this.callbacks.map(async (callback) => callback(signal)));

    if (exitCode !== undefined) {
      console.log('App will exit now');
      process.exit(exitCode);
    }
  }

  async runOnce(signal, exitCode) {
    if (this.runOncePromise) return this.runOncePromise;
    this.runOncePromise = this.run(signal, exitCode);
    return this.runOncePromise;
  }
}
