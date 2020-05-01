import { ObjectID } from 'mongodb';

function createIdQuery(id) {
  return { _id: ObjectID(id) };
}

const methods = [
  function findById(id) {
    return this.findOne(createIdQuery(id));
  },

  function deleteById(id) {
    return this.findOneAndDelete(createIdQuery(id));
  },

  function findOneIgnoreCase(query, locale = 'en_US', strength = 1) {
    return this.find(query).limit(1).collation({ locale, strength }).next();
  },
];

function makeModelCollection(collection) {
  const modelCollection = Object.create(collection);
  methods.forEach((method) => { modelCollection[method.name] = method; });
  return modelCollection;
}

export default makeModelCollection;
