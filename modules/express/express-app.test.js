import 'dotenv/config.js';
import mongodb from 'mongodb';
import ExpressApp from './express-app.mjs';

jest.mock('mongodb');
const { MongoClient, MongoParseError } = mongodb;
MongoClient.prototype.connect.mockImplementation(function mockConnect() {
  return Promise.resolve(this);
});

function makeObserver(events) {
  return (msg) => {
    const payload = ExpressApp.summarize(msg);
    events.push(payload);
    // console.log(payload);
  };
}

function makeLightObserver(events) {
  return (msg) => {
    const { type, name, event } = ExpressApp.summarize(msg);
    events.push({ type, name, event });
    // console.log({ type, name, event });
  };
}

describe('API server tests', () => {
  beforeEach(() => {
    MongoClient.mockClear();
    MongoClient.prototype.isConnected.mockReset();
  });

  test('Start and stop server without a database connection', async () => {
    expect.assertions(8);

    const events = [];
    const app = new ExpressApp('Test', 3000);

    app.addObservers(makeObserver(events));
    await app.start(); // Start server
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server
    expect(app.server).toBeNull();
    await app.start(); // Restart server after being stopped
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after restart
    expect(app.server).toBeNull();
    await app.start(); // Retart server again
    expect(app.server.listening).toBe(true);
    await app.start(); // Try to start server while it's already started
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after second restart
    expect(app.server).toBeNull();
    const startEvent = { type: 'server', name: 'Test', event: 'listening', data: { port: 3000 } };
    const stopEvents = [
      { type: 'server', name: 'Test', event: 'stop received', data: undefined },
      { type: 'server', name: 'Test', event: 'closed', data: undefined },
    ];
    const startStopEvents = [startEvent, ...stopEvents];
    expect(events).toStrictEqual([...startStopEvents, ...startStopEvents, ...startStopEvents]);
  });

  test('Server can\'t listen on a port in use', async () => {
    expect.assertions(4);

    const events = [];
    const app = new ExpressApp('Test A', 3000);
    const app2 = new ExpressApp('Test B', 3000);

    app.addObservers(makeObserver(events));
    app2.addObservers(makeLightObserver(events));
    await app.start(); // Start first server
    expect(app.server.listening).toBe(true);
    await app2.start(); // Try to start second server on the same port
    expect(app2.server).toBeNull();
    await app.stop(); // Stop first server
    expect(app.server).toBeNull();
    expect(events).toStrictEqual([
      { type: 'server', name: 'Test A', event: 'listening', data: { port: 3000 } },
      {
        type: 'server',
        name: 'Test B',
        event: 'listen EADDRINUSE: address already in use :::3000',
      },
      { type: 'server', name: 'Test B', event: 'stop received' },
      { type: 'server', name: 'Test B', event: 'not listening' },
      { type: 'server', name: 'Test A', event: 'stop received', data: undefined },
      { type: 'server', name: 'Test A', event: 'closed', data: undefined },
    ]);
  });

  test('Start and stop server with a database connection', async () => {
    expect.assertions(8);
    MongoClient.prototype.isConnected.mockReturnValue(true);

    const events = [];
    const app = new ExpressApp(
      'Test',
      3000,
      [{ host: 'db-host', db: 'myDb', username: 'user', password: 'password' }],
    );

    app.addObservers(makeObserver(events));
    await app.start(); // Start server
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server
    expect(app.server).toBeNull();
    await app.start(); // Restart server after being stopped
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after restart
    expect(app.server).toBeNull();
    await app.start(); // Retart server again
    expect(app.server.listening).toBe(true);
    await app.start(); // Try to start server while it's already started
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after second restart
    expect(app.server).toBeNull();
    const startEvents = [
      { type: 'db', name: 'myDb', event: 'connecting', data: undefined },
      { type: 'db', name: 'myDb', event: 'connected', data: undefined },
      { type: 'server', name: 'Test', event: 'listening', data: { port: 3000 } },
    ];
    const stopEvents = [
      { type: 'server', name: 'Test', event: 'stop received', data: undefined },
      { type: 'db', name: 'myDb', event: 'disconnected', data: undefined },
      { type: 'server', name: 'Test', event: 'closed', data: undefined },
    ];
    const startStopEvents = [...startEvents, ...stopEvents];
    expect(events).toStrictEqual([...startStopEvents, ...startStopEvents, ...startStopEvents]);
  });

  test('Start and stop server with multiple database connections', async () => {
    expect.assertions(8);
    MongoClient.prototype.isConnected.mockReturnValue(true);

    const events = [];
    const app = new ExpressApp(
      'Test',
      3000,
      [
        { host: 'db-host', db: 'myDb', username: 'user', password: 'password' },
        { host: 'db-host-2', db: 'myDb2', username: 'user', password: 'password' },
      ],
    );

    app.addObservers(makeObserver(events));
    await app.start(); // Start server
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server
    expect(app.server).toBeNull();
    await app.start(); // Restart server after being stopped
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after restart
    expect(app.server).toBeNull();
    await app.start(); // Retart server again
    expect(app.server.listening).toBe(true);
    await app.start(); // Try to start server while it's already started
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after second restart
    expect(app.server).toBeNull();
    const startEvents = [
      { type: 'db', name: 'myDb', event: 'connecting', data: undefined },
      { type: 'db', name: 'myDb2', event: 'connecting', data: undefined },
      { type: 'db', name: 'myDb', event: 'connected', data: undefined },
      { type: 'db', name: 'myDb2', event: 'connected', data: undefined },
      { type: 'server', name: 'Test', event: 'listening', data: { port: 3000 } },
    ];
    const stopEvents = [
      { type: 'server', name: 'Test', event: 'stop received', data: undefined },
      { type: 'db', name: 'myDb', event: 'disconnected', data: undefined },
      { type: 'db', name: 'myDb2', event: 'disconnected', data: undefined },
      { type: 'server', name: 'Test', event: 'closed', data: undefined },
    ];
    const startStopEvents = [...startEvents, ...stopEvents];
    expect(events).toStrictEqual([...startStopEvents, ...startStopEvents, ...startStopEvents]);
  });

  test('Can\'t start the server if the database host is invalid', async () => {
    expect.assertions(3);
    const reason = new MongoParseError();
    reason.message = 'URI does not have hostname, domain name and tld';
    MongoClient.prototype.connect.mockRejectedValueOnce(reason);

    const events = [];
    const app = new ExpressApp(
      'Test',
      3000,
      [{ host: 'notahost', db: 'myDb', username: 'user', password: 'password' }],
    );

    app.addObservers(makeLightObserver(events));
    await app.start(); // Start server
    expect(app.server).toBeNull();
    await app.stop(); // Stop server
    expect(app.server).toBeNull();
    const startEvents = [
      { type: 'db', name: 'myDb', event: 'connecting' },
      { type: 'db', name: 'myDb', event: 'URI does not have hostname, domain name and tld' },
    ];
    const stopEvents = [
      { type: 'server', name: 'Test', event: 'stop received' },
      { type: 'db', name: 'myDb', event: 'not connected' },
    ];
    expect(events).toStrictEqual([...startEvents, ...stopEvents]);
  });

  test('Can\'t start the server if the database fails to connect', async () => {
    expect.assertions(3);
    MongoClient.prototype.isConnected.mockReturnValueOnce(false);

    const events = [];
    const app = new ExpressApp(
      'Test',
      3000,
      [{ host: 'db-host', db: 'myDb', username: 'user', password: 'password' }],
    );

    app.addObservers(makeLightObserver(events));
    await app.start(); // Start server
    expect(app.server).toBeNull();
    await app.stop(); // Stop server
    expect(app.server).toBeNull();
    const startEvents = [
      { type: 'db', name: 'myDb', event: 'connecting' },
      { type: 'db', name: 'myDb', event: 'failed to connect' },
    ];
    const stopEvents = [
      { type: 'server', name: 'Test', event: 'stop received' },
      { type: 'db', name: 'myDb', event: 'not connected' },
    ];
    expect(events).toStrictEqual([...startEvents, ...stopEvents]);
  });
});
