import 'dotenv/config.js';
import mongodb from 'mongodb';

export default function connect(
  host = process.env.MONGODB_HOST,
  dbName = process.env.MONGODB_DB,
  username = process.env.MONGODB_USERNAME,
  password = process.env.MONGODB_PASSWORD,
) {
  const { MongoClient } = mongodb;
  const fixedDbName = dbName === undefined || dbName === null ? '' : dbName;
  const protocol = 'mongodb+srv';
  const queryParams = 'retryWrites=true&w=majority';
  const url = `${protocol}://${username}:${password}@${host}/${fixedDbName}?${queryParams}`;
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  return client.connect();
}
