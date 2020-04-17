const observable = (Superclass = Object) => class Observable extends Superclass {
  constructor(...superArgs) {
    super(...superArgs);
    this.observers = new Set();
  }

  addObservers(...callbacks) {
    callbacks.flat().forEach((observer) => { this.observers.add(observer); });
  }

  removeObservers(...observers) {
    observers.flat().forEach((observer) => { this.observers.delete(observer); });
  }

  notifyObservers(data) {
    this.observers.forEach((observer) => observer(data));
  }
};

export default observable;
