import 'dotenv/config.js';
import mongodb from 'mongodb';
import connect from './connect.mjs';

const { MongoParseError, MongoServerSelectionError } = mongodb;

describe('MongoDB connection tests', () => {
  test('Connects with default parameters', async () => {
    expect.assertions(2);

    const client = await connect();

    expect(client.url).toBe(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DB}?retryWrites=true&w=majority`);
    expect(client.options).toStrictEqual({ useNewUrlParser: true, useUnifiedTopology: true });
  });

  test('Connects with non-default parameters', async () => {
    expect.assertions(2);

    const client = await connect(
      process.env.MONGODB_TEST_HOST,
      process.env.MONGODB_TEST_DB,
      process.env.MONGODB_TEST_USERNAME,
      process.env.MONGODB_TEST_PASSWORD,
    );

    expect(client.url).toBe(`mongodb+srv://${process.env.MONGODB_TEST_USERNAME}:${process.env.MONGODB_TEST_PASSWORD}@${process.env.MONGODB_TEST_HOST}/${process.env.MONGODB_TEST_DB}?retryWrites=true&w=majority`);
    expect(client.options).toStrictEqual({ useNewUrlParser: true, useUnifiedTopology: true });
  });

  test('Connects when no db is specified', async () => {
    expect.assertions(2);

    const client = await connect(
      process.env.MONGODB_TEST_HOST,
      null,
      process.env.MONGODB_TEST_USERNAME,
      process.env.MONGODB_TEST_PASSWORD,
    );

    expect(client.url).toBe(`mongodb+srv://${process.env.MONGODB_TEST_USERNAME}:${process.env.MONGODB_TEST_PASSWORD}@${process.env.MONGODB_TEST_HOST}/?retryWrites=true&w=majority`);
    expect(client.options).toStrictEqual({ useNewUrlParser: true, useUnifiedTopology: true });
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
