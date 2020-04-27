import 'dotenv/config.js';
import mongodb from 'mongodb';
import connect from './connect.mjs';

jest.mock('mongodb');
const { MongoClient, MongoParseError, MongoServerSelectionError } = mongodb;
MongoClient.prototype.connect.mockImplementation(function mockConnect() {
  return Promise.resolve(this);
});

describe('MongoDB connection tests', () => {
  beforeEach(() => {
    MongoClient.mockClear();
    MongoParseError.mockClear();
    MongoServerSelectionError.mockClear();
  });

  test('Connects with default parameters', async () => {
    expect.assertions(3);

    const client = await connect();
    expect(client).toBeInstanceOf(MongoClient);
    expect(MongoClient).toHaveBeenCalledTimes(1);
    expect(MongoClient).toHaveBeenCalledWith(
      `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DB}?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useUnifiedTopology: true },
    );
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
    expect(MongoClient).toHaveBeenCalledTimes(1);
    expect(MongoClient).toHaveBeenCalledWith(
      `mongodb+srv://${process.env.MONGODB_TEST_USERNAME}:${process.env.MONGODB_TEST_PASSWORD}@${process.env.MONGODB_TEST_HOST}/${process.env.MONGODB_TEST_DB}?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useUnifiedTopology: true },
    );
  });

  test('Connects when no db is specified', async () => {
    expect.assertions(3);

    const client = await connect(
      process.env.MONGODB_TEST_HOST,
      null,
      process.env.MONGODB_TEST_USERNAME,
      process.env.MONGODB_TEST_PASSWORD,
    );
    expect(client).toBeInstanceOf(MongoClient);
    expect(MongoClient).toHaveBeenCalledTimes(1);
    expect(MongoClient).toHaveBeenCalledWith(
      `mongodb+srv://${process.env.MONGODB_TEST_USERNAME}:${process.env.MONGODB_TEST_PASSWORD}@${process.env.MONGODB_TEST_HOST}/?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useUnifiedTopology: true },
    );
  });

  test('Throws when host is invalid', async () => {
    expect.assertions(3);
    MongoClient.prototype.connect.mockImplementationOnce(() => {
      throw new MongoParseError('URI does not have hostname, domain name and tld');
    });

    try {
      await connect(
        'notahost',
        process.env.MONGODB_TEST_DB,
        process.env.MONGODB_TEST_USERNAME,
        process.env.MONGODB_TEST_PASSWORD,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(MongoParseError);
      expect(MongoParseError).toHaveBeenCalledTimes(1);
      expect(MongoParseError).toHaveBeenCalledWith(
        'URI does not have hostname, domain name and tld',
      );
    }
  });

  test('Throws when credentials are invalid', async () => {
    expect.assertions(3);
    MongoClient.prototype.connect.mockImplementationOnce(() => {
      throw new MongoServerSelectionError('Authentication failed.');
    });

    try {
      await connect(
        process.env.MONGODB_TEST_HOST,
        process.env.MONGODB_TEST_DB,
        'notauser',
        'badpassword',
      );
    } catch (err) {
      expect(err).toBeInstanceOf(MongoServerSelectionError);
      expect(MongoServerSelectionError).toHaveBeenCalledTimes(1);
      expect(MongoServerSelectionError).toHaveBeenCalledWith('Authentication failed.');
    }
  });
});
