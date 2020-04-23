import mongodb from 'mongodb';

const { ObjectID } = mongodb;

function findId(col, id) {
  return col.findOne({ _id: ObjectID(id) });
}
function findOneI(col, query, locale = 'en_US', strength = 1) {
  return col.find(query).limit(1).collation({ locale, strength }).next();
}

export { findId, findOneI };
