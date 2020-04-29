import mongodb from 'mongodb';
import Model from './model.mjs';

jest.mock('mongodb');
const { MongoClient, MongoParseError } = mongodb;
MongoClient.prototype.connect.mockImplementation(function mockConnect() {
  return Promise.resolve(this);
});

function makeObserver(events) {
  return (msg) => {
    const payload = Model.summarize(msg);
    events.push(payload);
    // console.log(payload);
  };
}

function makeLightObserver(events) {
  return (msg) => {
    const { subjectName, componentName, event } = Model.summarize(msg);
    events.push({ subjectName, componentName, event });
    // console.log({ subjectName, componentName, event });
  };
}

describe('Model tests', () => {
  beforeEach(() => {
    MongoClient.mockClear();
    MongoClient.prototype.isConnected.mockReset();
  });

  test('Start and stop a model with a single database connection', async () => {
    expect.assertions(16);
    MongoClient.prototype.isConnected.mockReturnValue(true);

    const model = new Model(
      'Model',
      [{ host: 'db-host', db: 'myDb', username: 'user', password: 'password' }],
    );
    const events = [];
    model.addObservers(makeObserver(events));

    expect(model.state).toBe('disconnected');
    const result = await model.connect(); // connect the model
    expect(result).toBe(model);
    expect(model.state).toBe('connected');
    await model.disconnect(); // disconnect the model
    expect(model).toBe(model);
    expect(model.state).toBe('disconnected');
    await model.connect(); // reconnect the model after disconnecting
    expect(model).toBe(model);
    expect(model.state).toBe('connected');
    await model.disconnect(); // disconnect the model after reconnecting
    expect(model).toBe(model);
    expect(model.state).toBe('disconnected');
    await model.connect(); // reconnect the model again
    expect(model).toBe(model);
    expect(model.state).toBe('connected');
    await model.connect(); // try to connect the model while it's already connected
    expect(model).toBe(model);
    expect(model.state).toBe('connected');
    await model.disconnect(); // disconnect the model after the second reconnect
    expect(model).toBe(model);
    expect(model.state).toBe('disconnected');
    const startEvents = [
      { subjectName: 'Model', componentName: null, event: 'connecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'connecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'connected', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'connected', data: undefined },
    ];
    const stopEvents = [
      { subjectName: 'Model', componentName: null, event: 'disconnecting', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'disconnect received', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'disconnecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'disconnected', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'disconnected', data: undefined },
    ];
    const startStopEvents = [...startEvents, ...stopEvents];
    expect(events).toStrictEqual([...startStopEvents, ...startStopEvents, ...startStopEvents]);
  });

  test('Start and stop a model with a multiple database connections', async () => {
    expect.assertions(16);
    MongoClient.prototype.isConnected.mockReturnValue(true);

    const model = new Model(
      'Model',
      [
        { host: 'db-host', db: 'myDb', username: 'user', password: 'password' },
        { host: 'db-host-2', db: 'myDb2', username: 'user', password: 'password' },
      ],
    );
    const events = [];
    model.addObservers(makeObserver(events));

    expect(model.state).toBe('disconnected');
    const result = await model.connect(); // connect the model
    expect(result).toBe(model);
    expect(model.state).toBe('connected');
    await model.disconnect(); // disconnect the model
    expect(model).toBe(model);
    expect(model.state).toBe('disconnected');
    await model.connect(); // reconnect the model after disconnecting
    expect(model).toBe(model);
    expect(model.state).toBe('connected');
    await model.disconnect(); // disconnect the model after reconnecting
    expect(model).toBe(model);
    expect(model.state).toBe('disconnected');
    await model.connect(); // reconnect the model again
    expect(model).toBe(model);
    expect(model.state).toBe('connected');
    await model.connect(); // try to connect the model while it's already connected
    expect(model).toBe(model);
    expect(model.state).toBe('connected');
    await model.disconnect(); // disconnect the model after the second reconnect
    expect(model).toBe(model);
    expect(model.state).toBe('disconnected');
    const startEvents = [
      { subjectName: 'Model', componentName: null, event: 'connecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'connecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb2', event: 'connecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'connected', data: undefined },
      { subjectName: 'Model', componentName: 'myDb2', event: 'connected', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'connected', data: undefined },
    ];
    const stopEvents = [
      { subjectName: 'Model', componentName: null, event: 'disconnecting', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'disconnect received', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'disconnecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb2', event: 'disconnecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'disconnected', data: undefined },
      { subjectName: 'Model', componentName: 'myDb2', event: 'disconnected', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'disconnected', data: undefined },
    ];
    const startStopEvents = [...startEvents, ...stopEvents];
    expect(events).toStrictEqual([...startStopEvents, ...startStopEvents, ...startStopEvents]);
  });

  test('Can\'t start the model if the database host is invalid', async () => {
    expect.assertions(3);
    const reason = new MongoParseError();
    reason.message = 'URI does not have hostname, domain name and tld';
    MongoClient.prototype.connect.mockRejectedValueOnce(reason);

    const model = new Model(
      'Model',
      [{ host: 'db-host', db: 'myDb', username: 'user', password: 'password' }],
    );
    const events = [];
    model.addObservers(makeLightObserver(events));

    const result = await model.connect();
    expect(result).toBe(model);
    expect(model.state).toBe('disconnected');
    const startEvents = [
      { subjectName: 'Model', componentName: null, event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb', event: 'connecting' },
      {
        subjectName: 'Model',
        componentName: 'myDb',
        event: 'URI does not have hostname, domain name and tld',
      },
      { subjectName: 'Model', componentName: null, event: 'disconnecting' },
      { subjectName: 'Model', componentName: null, event: 'disconnect received' },
      { subjectName: 'Model', componentName: 'myDb', event: 'not connected' },
      { subjectName: 'Model', componentName: null, event: 'disconnected' },
    ];
    expect(events).toStrictEqual(startEvents);
  });

  test('Can\'t start the model if a database host is invalid', async () => {
    expect.assertions(3);
    const reason = new MongoParseError();
    reason.message = 'URI does not have hostname, domain name and tld';
    MongoClient.prototype.connect.mockRejectedValueOnce(reason);
    MongoClient.prototype.isConnected.mockReturnValue(true);

    const model = new Model(
      'Model',
      [
        { host: 'db-host', db: 'myDb', username: 'user', password: 'password' },
        { host: 'db-host-2', db: 'myDb2', username: 'user', password: 'password' },
      ],
    );
    const events = [];
    model.addObservers(makeLightObserver(events));

    const result = await model.connect();
    expect(result).toBe(model);
    expect(model.state).toBe('disconnected');
    const startEvents = [
      { subjectName: 'Model', componentName: null, event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb', event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb2', event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb2', event: 'connected' },
      {
        subjectName: 'Model',
        componentName: 'myDb',
        event: 'URI does not have hostname, domain name and tld',
      },
      { subjectName: 'Model', componentName: null, event: 'disconnecting' },
      { subjectName: 'Model', componentName: null, event: 'disconnect received' },
      { subjectName: 'Model', componentName: 'myDb', event: 'not connected' },
      { subjectName: 'Model', componentName: 'myDb2', event: 'disconnecting' },
      { subjectName: 'Model', componentName: 'myDb2', event: 'disconnected' },
      { subjectName: 'Model', componentName: null, event: 'disconnected' },
    ];
    expect(events).toStrictEqual(startEvents);
  });

  test('Can\'t start the model if the database fails to connect', async () => {
    expect.assertions(3);
    MongoClient.prototype.isConnected.mockReturnValue(false);

    const model = new Model(
      'Model',
      [{ host: 'db-host', db: 'myDb', username: 'user', password: 'password' }],
    );
    const events = [];
    model.addObservers(makeLightObserver(events));

    const result = await model.connect();
    expect(result).toBe(model);
    expect(model.state).toBe('disconnected');
    const startEvents = [
      { subjectName: 'Model', componentName: null, event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb', event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb', event: 'failed to connect' },
      { subjectName: 'Model', componentName: null, event: 'disconnecting' },
      { subjectName: 'Model', componentName: null, event: 'disconnect received' },
      { subjectName: 'Model', componentName: 'myDb', event: 'not connected' },
      { subjectName: 'Model', componentName: null, event: 'disconnected' },
    ];
    expect(events).toStrictEqual(startEvents);
  });

  test('Can\'t start the model a database fails to connect', async () => {
    expect.assertions(3);
    MongoClient.prototype.isConnected.mockReturnValue(true);
    MongoClient.prototype.isConnected.mockReturnValueOnce(false);

    const model = new Model(
      'Model',
      [
        { host: 'db-host', db: 'myDb', username: 'user', password: 'password' },
        { host: 'db-host-2', db: 'myDb2', username: 'user', password: 'password' },
      ],
    );
    const events = [];
    model.addObservers(makeLightObserver(events));

    const result = await model.connect();
    expect(result).toBe(model);
    expect(model.state).toBe('disconnected');
    const startEvents = [
      { subjectName: 'Model', componentName: null, event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb', event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb2', event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb2', event: 'connected' },
      { subjectName: 'Model', componentName: 'myDb', event: 'failed to connect' },
      { subjectName: 'Model', componentName: null, event: 'disconnecting' },
      { subjectName: 'Model', componentName: null, event: 'disconnect received' },
      { subjectName: 'Model', componentName: 'myDb', event: 'not connected' },
      { subjectName: 'Model', componentName: 'myDb2', event: 'disconnecting' },
      { subjectName: 'Model', componentName: 'myDb2', event: 'disconnected' },
      { subjectName: 'Model', componentName: null, event: 'disconnected' },
    ];
    console.log('events', events);
    expect(events).toStrictEqual(startEvents);
  });
});
