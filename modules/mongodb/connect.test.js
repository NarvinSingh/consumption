import 'dotenv/config.js';
import { MongoClient, MongoParseError, MongoServerSelectionError } from 'mongodb';
import connect from './connect.mjs';

describe('MongoDB connection tests', () => {
  beforeAll(() => {
    jest.setTimeout(60000);
  });

  test('Connects with default parameters', async () => {
    expect.assertions(3);

    const client = await connect();

    expect(client).toBeInstanceOf(MongoClient);
    expect(client.isConnected()).toBe(true);
    await client.close();
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
    await client.close();
    expect(client.isConnected()).toBe(false);
  });

  test('Connects when no db is specified', async () => {
    expect.assertions(3);

    const client = await connect(
      process.env.MONGODB_TEST_HOST,
      '',
      process.env.MONGODB_TEST_USERNAME,
      process.env.MONGODB_TEST_PASSWORD,
    );

    expect(client).toBeInstanceOf(MongoClient);
    expect(client.isConnected()).toBe(true);
    await client.close();
    expect(client.isConnected()).toBe(false);
  });

  test('Throws when host is invalid', async () => {
    expect.assertions(2);

    try {
      await connect(
        'notahost',
        process.env.MONGODB_TEST_DB,
        process.env.MONGODB_TEST_USERNAME,
        process.env.MONGODB_TEST_PASSWORD,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(MongoParseError);
      expect(err.message).toBe('URI does not have hostname, domain name and tld');
    }
  });

  test('Throws when credentials are invalid', async () => {
    expect.assertions(2);

    try {
      await connect(
        process.env.MONGODB_TEST_HOST,
        process.env.MONGODB_TEST_DB,
        'notauser',
        'badpassword',
      );
    } catch (err) {
      expect(err).toBeInstanceOf(MongoServerSelectionError);
      expect(err.message).toBe('Authentication failed.');
    }
  });
});
