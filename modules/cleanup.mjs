export default class Cleanup {
  constructor(signals = ['SIGINT', 'SIGQUIT', 'SIGTERM'], ...rest) {
    this.signals = [signals].flat().concat(rest);
    this.callbacks = [];
    this.signals.forEach((signal) => {
      process.on(signal, () => this.run(signal));
    });
  }

  addCallbacks(...callbacks) {
    this.callbacks.push(...callbacks.flat());
  }

  async run(signal, code = 0) {
    console.log(`${signal} received`);
    await Promise.all(this.callbacks.map(async (callback) => callback(signal)));
    console.log('App will exit now');
    process.exit(code);
  }
}
