export default class Collection {
  constructor(name) {
    this.collectionName = name;
    this.mock = {};
  }

  findOne() {
    return Promise.resolve(this.mock.findOneResult);
  }

  insertOne() {
    return Promise.resolve(this.mock.insertOneResult);
  }
}
