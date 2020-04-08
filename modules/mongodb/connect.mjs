import 'dotenv/config.js';
import mongodb from 'mongodb';

async function connect(
  host = process.env.MONGODB_HOST,
  dbName = process.env.MONGODB_DB,
  username = process.env.MONGODB_USERNAME,
  password = process.env.MONGODB_PASSWORD,
) {
  const { MongoClient } = mongodb;
  const uri = `mongodb+srv://${username}:${password}@${host}/${dbName}?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  return client.connect();
}

export default connect;
