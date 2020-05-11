import mongodb from 'mongodb';
import { mix } from '../utils.mjs';

const { ObjectID } = mongodb;

function createIdQuery(id) {
  return { _id: ObjectID(id) };
}

const modelCollection = (Superclass = Object) => class ModelCollection extends Superclass {
  static createId() {
    return ObjectID();
  }

  findById(id) {
    return this.findOne(createIdQuery(id));
  }

  deleteById(id) {
    return this.findOneAndDelete(createIdQuery(id));
  }

  findOneIgnoreCase(query, locale = 'en_US', strength = 1) {
    return this.find(query).limit(1).collation({ locale, strength }).next();
  }
};

export default function makeModelCollection(collection) {
  return mix(collection, modelCollection);
}
