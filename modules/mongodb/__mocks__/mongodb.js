import MongoClient from './mongo-client.mjs';
import Db from './db.mjs';
import Collection from './collection.mjs';
import MongoParseError from './mongo-parse-error.mjs';
import MongoServerSelectionError from './mongo-server-selection-error.mjs';

const mongodb = {
  MongoClient,
  Db,
  Collection,
  MongoParseError,
  MongoServerSelectionError,
};

export default mongodb;
