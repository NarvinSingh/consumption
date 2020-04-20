import Collection from './collection.mjs';

export default class Db {
  constructor(databaseName) {
    this.mock = { name: databaseName };
  }

  collection(name) {
    const col = new Collection(name);
    col.db = this.mock.name;
    return col;
  }
}
