export default class MongoParseError extends Error {
  constructor(...args) {
    super(...args);
    this.isMocked = true;
  }
}
