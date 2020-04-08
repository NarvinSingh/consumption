import 'dotenv/config.js';
import { MongoClient } from 'mongodb';
import connect from './connect.mjs';

describe('MongoDB connection tests', () => {
  test('Connects with default parameters', async () => {
    expect.assertions(3);

    const client = await connect();

    expect(client).toBeInstanceOf(MongoClient);
    expect(client.isConnected()).toBe(true);
    client.close();
    expect(client.isConnected()).toBe(false);
  });

  test('Connects with non-default parameters', async () => {
    expect.assertions(3);

    const client = await connect(
      process.env.MONGODB_TEST_HOST,
      process.env.MONGODB_TEST_DB,
      process.env.MONGODB_TEST_USERNAME,
      process.env.MONGODB_TEST_PASSWORD,
    );

    expect(client).toBeInstanceOf(MongoClient);
    expect(client.isConnected()).toBe(true);
    client.close();
    expect(client.isConnected()).toBe(false);
  });
});
