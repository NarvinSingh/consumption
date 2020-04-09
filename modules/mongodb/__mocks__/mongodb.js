import MongoClient from './mongo-client.mjs';
import MongoParseError from './mongo-parse-error.mjs';
import MongoServerSelectionError from './mongo-server-selection-error.mjs';

const mongodb = { MongoClient, MongoParseError, MongoServerSelectionError };

export default mongodb;
