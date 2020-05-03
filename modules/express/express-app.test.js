import mongodb from 'mongodb';
import makeExpressApp from './express-app.mjs';
import Model from '../mongodb/model.mjs';
import request from '../http-request.mjs';

jest.mock('mongodb');
const { MongoClient, MongoParseError } = mongodb;
MongoClient.prototype.connect.mockImplementation(function mockConnect() {
  return Promise.resolve(this);
});

const { summarize } = makeExpressApp().constructor;

function makeObserver(events) {
  return (msg) => {
    const payload = summarize(msg);
    events.push(payload);
    // console.log(payload);
  };
}

function makeLightObserver(events) {
  return (msg) => {
    const { subjectName, componentName, event } = summarize(msg);
    events.push({ subjectName, componentName, event });
    // console.log({ subjectName, componentName, event });
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
    const app = makeExpressApp('App', 3000);

    app.addObservers(makeObserver(events));
    await app.start(); // Start server
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server
    expect(app.state).toBe('stopped');
    await app.start(); // Restart server after being stopped
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after restart
    expect(app.state).toBe('stopped');
    await app.start(); // Retart server again
    expect(app.server.listening).toBe(true);
    await app.start(); // Try to start server while it's already started
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after second restart
    expect(app.state).toBe('stopped');
    const startEvents = [
      { subjectName: 'App', componentName: 'server', event: 'starting', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'listening', data: { port: 3000 } },
      { subjectName: 'App', componentName: 'server', event: 'started', data: undefined },
    ];
    const stopEvents = [
      { subjectName: 'App', componentName: 'server', event: 'stopping', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'stop received', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'closing', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'closed', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'stopped', data: undefined },
    ];
    const startStopEvents = [...startEvents, ...stopEvents];
    expect(events).toStrictEqual([...startStopEvents, ...startStopEvents, ...startStopEvents]);
  });

  test('Start and stop server with a model', async () => {
    expect.assertions(8);
    MongoClient.prototype.isConnected.mockReturnValue(true);
    MongoClient.prototype.db.mockReturnValue({ collection: () => ({}) });

    const events = [];
    const app = makeExpressApp(
      'App',
      3000,
      [
        new Model(
          'Model',
          [{ host: 'db-host', db: 'myDb', cols: ['c1'], username: 'user', password: 'password' }],
        ),
      ],
    );

    app.addObservers(makeObserver(events));
    await app.start(); // Start server
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server
    expect(app.state).toBe('stopped');
    await app.start(); // Restart server after being stopped
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after restart
    expect(app.state).toBe('stopped');
    await app.start(); // Retart server again
    expect(app.server.listening).toBe(true);
    await app.start(); // Try to start server while it's already started
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after second restart
    expect(app.state).toBe('stopped');
    const startEvents = [
      { subjectName: 'App', componentName: 'server', event: 'starting', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'connecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'connecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'connected', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'connected', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'listening', data: { port: 3000 } },
      { subjectName: 'App', componentName: 'server', event: 'started', data: undefined },
    ];
    const stopEvents = [
      { subjectName: 'App', componentName: 'server', event: 'stopping', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'stop received', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'closing', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'closed', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'disconnecting', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'disconnect received', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'disconnecting', data: undefined },
      { subjectName: 'Model', componentName: 'myDb', event: 'disconnected', data: undefined },
      { subjectName: 'Model', componentName: null, event: 'disconnected', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'stopped', data: undefined },
    ];
    const startStopEvents = [...startEvents, ...stopEvents];
    expect(events).toStrictEqual([...startStopEvents, ...startStopEvents, ...startStopEvents]);
  });

  test('Start and stop server with multiple models', async () => {
    expect.assertions(8);
    MongoClient.prototype.isConnected.mockReturnValue(true);
    MongoClient.prototype.db.mockReturnValue({ collection: () => ({}) });

    const events = [];
    const app = makeExpressApp(
      'App',
      3000,
      [
        new Model(
          'Model A',
          [{ host: 'db-host', db: 'myDb', cols: ['c1'], username: 'user', password: 'password' }],
        ),
        new Model(
          'Model B',
          [{ host: 'db-host-2', db: 'myDb2', cols: ['c2'], username: 'user', password: 'password' }],
        ),
      ],
    );

    app.addObservers(makeObserver(events));
    await app.start(); // Start server
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server
    expect(app.state).toBe('stopped');
    await app.start(); // Restart server after being stopped
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after restart
    expect(app.state).toBe('stopped');
    await app.start(); // Retart server again
    expect(app.server.listening).toBe(true);
    await app.start(); // Try to start server while it's already started
    expect(app.server.listening).toBe(true);
    await app.stop(); // Stop server after second restart
    expect(app.state).toBe('stopped');
    const startEvents = [
      { subjectName: 'App', componentName: 'server', event: 'starting', data: undefined },
      { subjectName: 'Model A', componentName: null, event: 'connecting', data: undefined },
      { subjectName: 'Model A', componentName: 'myDb', event: 'connecting', data: undefined },
      { subjectName: 'Model B', componentName: null, event: 'connecting', data: undefined },
      { subjectName: 'Model B', componentName: 'myDb2', event: 'connecting', data: undefined },
      { subjectName: 'Model A', componentName: 'myDb', event: 'connected', data: undefined },
      { subjectName: 'Model B', componentName: 'myDb2', event: 'connected', data: undefined },
      { subjectName: 'Model A', componentName: null, event: 'connected', data: undefined },
      { subjectName: 'Model B', componentName: null, event: 'connected', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'listening', data: { port: 3000 } },
      { subjectName: 'App', componentName: 'server', event: 'started', data: undefined },
    ];
    const stopEvents = [
      { subjectName: 'App', componentName: 'server', event: 'stopping', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'stop received', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'closing', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'closed', data: undefined },
      { subjectName: 'Model A', componentName: null, event: 'disconnecting', data: undefined },
      {
        subjectName: 'Model A',
        componentName: null,
        event: 'disconnect received',
        data: undefined,
      },
      { subjectName: 'Model B', componentName: null, event: 'disconnecting', data: undefined },
      {
        subjectName: 'Model B',
        componentName: null,
        event: 'disconnect received',
        data: undefined,
      },
      { subjectName: 'Model A', componentName: 'myDb', event: 'disconnecting', data: undefined },
      { subjectName: 'Model B', componentName: 'myDb2', event: 'disconnecting', data: undefined },
      { subjectName: 'Model A', componentName: 'myDb', event: 'disconnected', data: undefined },
      { subjectName: 'Model B', componentName: 'myDb2', event: 'disconnected', data: undefined },
      { subjectName: 'Model A', componentName: null, event: 'disconnected', data: undefined },
      { subjectName: 'Model B', componentName: null, event: 'disconnected', data: undefined },
      { subjectName: 'App', componentName: 'server', event: 'stopped', data: undefined },
    ];
    const startStopEvents = [...startEvents, ...stopEvents];
    expect(events).toStrictEqual([...startStopEvents, ...startStopEvents, ...startStopEvents]);
  });

  test('Can create routes and make requests', async () => {
    expect.assertions(10);

    const events = [];
    const app = makeExpressApp('App', 3000);

    app.addObservers(makeLightObserver(events));
    app.get('/', (req, res) => res.send('GET response'));
    app.post('/', (req, res) => res.send('POST response'));
    app.put('/', (req, res) => res.send('PUT response'));
    app.delete('/', (req, res) => res.send('DELETE response'));
    await app.start();
    const results = await Promise.all([
      request.get('http://localhost:3000'),
      request.post('http://localhost:3000'),
      request.put('http://localhost:3000'),
      request.delete('http://localhost:3000'),
    ]);
    expect(results[0].statusCode).toBe(200);
    expect(results[1].statusCode).toBe(200);
    expect(results[2].statusCode).toBe(200);
    expect(results[3].statusCode).toBe(200);
    expect(results[0].body).toBe('GET response');
    expect(results[1].body).toBe('POST response');
    expect(results[2].body).toBe('PUT response');
    expect(results[3].body).toBe('DELETE response');
    await app.stop();
    expect(app.state).toBe('stopped');
    const startEvents = [
      { subjectName: 'App', componentName: 'server', event: 'starting' },
      { subjectName: 'App', componentName: 'server', event: 'listening' },
      { subjectName: 'App', componentName: 'server', event: 'started' },
    ];
    const stopEvents = [
      { subjectName: 'App', componentName: 'server', event: 'stopping' },
      { subjectName: 'App', componentName: 'server', event: 'stop received' },
      { subjectName: 'App', componentName: 'server', event: 'closing' },
      { subjectName: 'App', componentName: 'server', event: 'closed' },
      { subjectName: 'App', componentName: 'server', event: 'stopped' },
    ];
    expect(events).toStrictEqual([...startEvents, ...stopEvents]);
  });

  test('Can\'t listen on a port in use', async () => {
    expect.assertions(4);

    const events = [];
    const app = makeExpressApp('App A', 3000);
    const app2 = makeExpressApp('App B', 3000);

    app.addObservers(makeObserver(events));
    app2.addObservers(makeLightObserver(events));
    await app.start(); // Start first server
    expect(app.server.listening).toBe(true);
    await app2.start(); // Try to start second server on the same port
    expect(app2.state).toBe('stopped');
    await app.stop(); // Stop first server
    expect(app.state).toBe('stopped');
    expect(events).toStrictEqual([
      { subjectName: 'App A', componentName: 'server', event: 'starting', data: undefined },
      { subjectName: 'App A', componentName: 'server', event: 'listening', data: { port: 3000 } },
      { subjectName: 'App A', componentName: 'server', event: 'started', data: undefined },
      { subjectName: 'App B', componentName: 'server', event: 'starting' },
      {
        subjectName: 'App B',
        componentName: 'server',
        event: 'listen EADDRINUSE: address already in use :::3000',
      },
      { subjectName: 'App B', componentName: 'server', event: 'stopping' },
      { subjectName: 'App B', componentName: 'server', event: 'stop received' },
      { subjectName: 'App B', componentName: 'server', event: 'not listening' },
      { subjectName: 'App B', componentName: 'server', event: 'stopped' },
      { subjectName: 'App A', componentName: 'server', event: 'stopping', data: undefined },
      { subjectName: 'App A', componentName: 'server', event: 'stop received', data: undefined },
      { subjectName: 'App A', componentName: 'server', event: 'closing', data: undefined },
      { subjectName: 'App A', componentName: 'server', event: 'closed', data: undefined },
      { subjectName: 'App A', componentName: 'server', event: 'stopped', data: undefined },
    ]);
  });

  test('Can\'t start the server if the model database host is invalid', async () => {
    expect.assertions(2);
    const reason = new MongoParseError();
    reason.message = 'URI does not have hostname, domain name and tld';
    MongoClient.prototype.connect.mockRejectedValueOnce(reason);

    const events = [];
    const app = makeExpressApp(
      'App',
      3000,
      [
        new Model(
          'Model',
          [{ host: 'notahost', db: 'myDb', cols: ['c1'], username: 'user', password: 'password' }],
        ),
      ],
    );

    app.addObservers(makeLightObserver(events));
    await app.start(); // Start server
    expect(app.state).toBe('stopped');
    const startEvents = [
      { subjectName: 'App', componentName: 'server', event: 'starting' },
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
    const stopEvents = [
      { subjectName: 'App', componentName: 'server', event: 'stopping' },
      { subjectName: 'App', componentName: 'server', event: 'stop received' },
      { subjectName: 'App', componentName: 'server', event: 'stopped' },
    ];
    expect(events).toStrictEqual([...startEvents, ...stopEvents]);
  });

  test('Can\'t start the server if the database fails to connect', async () => {
    expect.assertions(2);
    MongoClient.prototype.isConnected.mockReturnValueOnce(false);

    const events = [];
    const app = makeExpressApp(
      'App',
      3000,
      [
        new Model(
          'Model',
          [{ host: 'db-host', db: 'myDb', cols: ['c1'], username: 'user', password: 'password' }],
        ),
      ],
    );

    app.addObservers(makeLightObserver(events));
    await app.start(); // Start server
    expect(app.state).toBe('stopped');
    const startEvents = [
      { subjectName: 'App', componentName: 'server', event: 'starting' },
      { subjectName: 'Model', componentName: null, event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb', event: 'connecting' },
      { subjectName: 'Model', componentName: 'myDb', event: 'failed to connect' },
      { subjectName: 'Model', componentName: null, event: 'disconnecting' },
      { subjectName: 'Model', componentName: null, event: 'disconnect received' },
      { subjectName: 'Model', componentName: 'myDb', event: 'not connected' },
      { subjectName: 'Model', componentName: null, event: 'disconnected' },
    ];
    const stopEvents = [
      { subjectName: 'App', componentName: 'server', event: 'stopping' },
      { subjectName: 'App', componentName: 'server', event: 'stop received' },
      { subjectName: 'App', componentName: 'server', event: 'stopped' },
    ];
    expect(events).toStrictEqual([...startEvents, ...stopEvents]);
  });

  test('Can\'t make a request if server is not started', async () => {
    expect.assertions(3);

    const events = [];
    const app = makeExpressApp('App', 3000);

    app.addObservers(makeLightObserver(events));
    await app.start();
    app.state = 'starting'; // fake the app not being started
    const result = await request.get('http://localhost:3000');
    expect(result.statusCode).toBe(500);
    await app.stop();
    expect(app.state).toBe('stopped');
    const startEvents = [
      { subjectName: 'App', componentName: 'server', event: 'starting' },
      { subjectName: 'App', componentName: 'server', event: 'listening' },
      { subjectName: 'App', componentName: 'server', event: 'started' },
      { subjectName: 'App', componentName: 'server', event: 'not started' },
    ];
    const stopEvents = [
      { subjectName: 'App', componentName: 'server', event: 'stopping' },
      { subjectName: 'App', componentName: 'server', event: 'stop received' },
      { subjectName: 'App', componentName: 'server', event: 'closing' },
      { subjectName: 'App', componentName: 'server', event: 'closed' },
      { subjectName: 'App', componentName: 'server', event: 'stopped' },
    ];
    expect(events).toStrictEqual([...startEvents, ...stopEvents]);
  });
});
