import Cleanup from './cleanup.mjs';

describe('Cleanup class tests', () => {
  afterEach(() => {
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGQUIT');
    process.removeAllListeners('SIGTERM');
  });

  test('Insantiate class', () => {
    expect.assertions(1);
    const cleanup = new Cleanup();

    expect(cleanup).toBeInstanceOf(Cleanup);
  });

  test('Insantiate class with an array parameter', () => {
    expect.assertions(1);
    const cleanup = new Cleanup(['SIGINT']);

    expect(cleanup.signals).toStrictEqual(['SIGINT']);
  });

  test('Insantiate class with a string parameter', () => {
    expect.assertions(1);
    const cleanup = new Cleanup('SIGINT');

    expect(cleanup.signals).toStrictEqual(['SIGINT']);
  });

  test('Insantiate class with an array and a string parameter', () => {
    expect.assertions(1);
    const cleanup = new Cleanup(['SIGINT'], 'SIGQUIT');

    expect(cleanup.signals).toStrictEqual(['SIGINT', 'SIGQUIT']);
  });

  test('Insantiate class with string parameters', () => {
    expect.assertions(1);
    const cleanup = new Cleanup('SIGINT', 'SIGQUIT');

    expect(cleanup.signals).toStrictEqual(['SIGINT', 'SIGQUIT']);
  });

  test('Add default process listenters', () => {
    expect.assertions(4);
    const cleanup = new Cleanup();

    expect(cleanup.signals).toStrictEqual(['SIGINT', 'SIGQUIT', 'SIGTERM']);
    expect(process.listenerCount('SIGINT')).toBe(1);
    expect(process.listenerCount('SIGQUIT')).toBe(1);
    expect(process.listenerCount('SIGTERM')).toBe(1);
  });

  test('Call process listenters', () => {
    expect.assertions(2);
    const cleanup = new Cleanup('SIGINT');
    const mockRunOnce = jest.fn();

    cleanup.runOnce = mockRunOnce;
    process.listeners('SIGINT')[0]();
    expect(mockRunOnce).toHaveBeenCalledTimes(1);
    expect(mockRunOnce).toHaveBeenCalledWith('SIGINT', 0);
  });

  test('Add a single callback passed as an individual parameter', () => {
    expect.assertions(1);
    const cleanup = new Cleanup();
    const callback = () => Promise.resolve();

    cleanup.addCallbacks(callback);
    expect(cleanup.callbacks).toStrictEqual([callback]);
  });

  test('Add a single callback passed as an array', () => {
    expect.assertions(1);
    const cleanup = new Cleanup();
    const callback = () => Promise.resolve();

    cleanup.addCallbacks([callback]);
    expect(cleanup.callbacks).toStrictEqual([callback]);
  });

  test('Add multiple callbacks passed as individual parameters', () => {
    expect.assertions(1);
    const cleanup = new Cleanup();
    const callbacks = [() => Promise.resolve(), () => Promise.resolve()];

    cleanup.addCallbacks(callbacks[0], callbacks[1]);
    expect(cleanup.callbacks).toStrictEqual(callbacks);
  });

  test('Add multiple callbacks passed as an array', () => {
    expect.assertions(1);
    const cleanup = new Cleanup();
    const callbacks = [() => Promise.resolve(), () => Promise.resolve()];

    cleanup.addCallbacks(callbacks);
    expect(cleanup.callbacks).toStrictEqual(callbacks);
  });

  test('Run cleanup with a single callback and not exit', async () => {
    expect.assertions(4);
    const cleanup = new Cleanup();
    const callback = jest.fn(() => Promise.resolve());
    const mockExit = jest.fn();
    const realExit = process.exit;
    const events = [];

    process.exit = mockExit;
    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callback);
    await cleanup.run('Exception');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Exception');
    expect(mockExit).not.toHaveBeenCalled();
    expect(events).toStrictEqual(['Exception received']);
    process.exit = realExit;
  });

  test('Run cleanup with a single callback and exit', async () => {
    expect.assertions(4);
    const cleanup = new Cleanup();
    const callback = jest.fn(() => Promise.resolve());
    const mockExit = jest.fn();
    const realExit = process.exit;

    process.exit = mockExit;
    cleanup.addCallbacks(callback);
    await cleanup.run('Exception', 0);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Exception');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
    process.exit = realExit;
  });

  test('Run cleanup with multiple callbacks and not exit', async () => {
    expect.assertions(5);
    const cleanup = new Cleanup();
    const callbacks = [jest.fn(() => Promise.resolve()), jest.fn(() => Promise.resolve())];
    const mockExit = jest.fn();
    const realExit = process.exit;

    process.exit = mockExit;
    cleanup.addCallbacks(callbacks);
    await cleanup.run('Exception');
    expect(callbacks[0]).toHaveBeenCalledTimes(1);
    expect(callbacks[0]).toHaveBeenCalledWith('Exception');
    expect(callbacks[1]).toHaveBeenCalledTimes(1);
    expect(callbacks[1]).toHaveBeenCalledWith('Exception');
    expect(mockExit).not.toHaveBeenCalled();
    process.exit = realExit;
  });

  test('Run cleanup with multiple callbacks and exit', async () => {
    expect.assertions(7);
    const cleanup = new Cleanup();
    const callbacks = [jest.fn(() => Promise.resolve()), jest.fn(() => Promise.resolve())];
    const mockExit = jest.fn();
    const realExit = process.exit;
    const events = [];

    process.exit = mockExit;
    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callbacks);
    await cleanup.run('Exception', 0);
    expect(callbacks[0]).toHaveBeenCalledTimes(1);
    expect(callbacks[0]).toHaveBeenCalledWith('Exception');
    expect(callbacks[1]).toHaveBeenCalledTimes(1);
    expect(callbacks[1]).toHaveBeenCalledWith('Exception');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
    expect(events).toStrictEqual(['Exception received', 'App will exit now']);
    process.exit = realExit;
  });

  test('Cleanup only runs once', async () => {
    expect.assertions(3);
    const cleanup = new Cleanup();
    const callback = jest.fn(() => Promise.resolve());
    const events = [];

    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callback);
    await cleanup.runOnce('Exception 1');
    await cleanup.runOnce('Exception 2');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Exception 1');
    expect(events).toStrictEqual(['Exception 1 received']);
  });

  test('Cleanup running once resolves after run does', async () => {
    expect.assertions(1);
    const cleanup = new Cleanup();
    const callback = jest.fn(() => Promise.resolve());
    const events = [];

    cleanup.mock = { run: cleanup.run, runOnce: cleanup.runOnce };
    cleanup.run = async function mockRun(...args) {
      const result = await cleanup.mock.run.call(this, ...args);
      events.push({ method: 'run', args });
      return result;
    };
    cleanup.runOnce = async function mockRunOnce(...args) {
      const result = await cleanup.mock.runOnce.call(this, ...args);
      events.push({ method: 'runOnce', args });
      return result;
    };
    cleanup.addCallbacks(callback);
    await cleanup.runOnce('Exception 1');
    events.push('done');
    expect(events).toStrictEqual([
      { method: 'run', args: ['Exception 1', undefined] },
      { method: 'runOnce', args: ['Exception 1'] },
      'done',
    ]);
  });
});
