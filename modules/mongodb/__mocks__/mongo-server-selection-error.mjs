export default class MongoServerSelectionError extends Error {
  constructor(...args) {
    super(...args);
    this.isMocked = true;
  }
}
