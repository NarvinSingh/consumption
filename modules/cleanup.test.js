import Cleanup from './cleanup.mjs';

describe('Cleanup class tests', () => {
  afterEach(() => {
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGQUIT');
    process.removeAllListeners('SIGTERM');
  });

  test('Insantiate cleanup with default parameters', () => {
    expect.assertions(5);
    const cleanup = new Cleanup();

    expect(cleanup.isRerunnable).toBe(false);
    expect(cleanup.signals).toStrictEqual(['SIGINT', 'SIGQUIT', 'SIGTERM']);
    expect(process.listenerCount('SIGINT')).toBe(1);
    expect(process.listenerCount('SIGQUIT')).toBe(1);
    expect(process.listenerCount('SIGTERM')).toBe(1);
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
    expect.assertions(5);
    const cleanup = new Cleanup();
    const callback = jest.fn(() => Promise.resolve());
    const mockExit = jest.fn();
    const realExit = process.exit;
    const events = [];

    process.exit = mockExit;
    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callback);
    await cleanup.run('Exception', 0);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Exception');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
    expect(events).toStrictEqual(['Exception received', 'App will exit with code 0']);
    process.exit = realExit;
  });

  test('Run cleanup with multiple callbacks and not exit', async () => {
    expect.assertions(6);
    const cleanup = new Cleanup();
    const callbacks = [jest.fn(() => Promise.resolve()), jest.fn(() => Promise.resolve())];
    const mockExit = jest.fn();
    const realExit = process.exit;
    const events = [];

    process.exit = mockExit;
    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callbacks);
    await cleanup.run('Exception');
    expect(callbacks[0]).toHaveBeenCalledTimes(1);
    expect(callbacks[0]).toHaveBeenCalledWith('Exception');
    expect(callbacks[1]).toHaveBeenCalledTimes(1);
    expect(callbacks[1]).toHaveBeenCalledWith('Exception');
    expect(mockExit).not.toHaveBeenCalled();
    expect(events).toStrictEqual(['Exception received']);
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
    expect(events).toStrictEqual(['Exception received', 'App will exit with code 0']);
    process.exit = realExit;
  });

  test('Run process listenter and not exit', () => {
    expect.assertions(4);
    const cleanup = new Cleanup(false, ['SIGINT']);
    const callback = jest.fn(() => Promise.resolve());
    const mockExit = jest.fn();
    const realExit = process.exit;
    const events = [];

    process.exit = mockExit;
    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callback);
    process.listeners('SIGINT')[0]('SIGINT');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('SIGINT');
    expect(mockExit).not.toHaveBeenCalled();
    expect(events).toStrictEqual(['SIGINT received']);
    process.exit = realExit;
  });

  test('Run process listenter and exit', (done) => {
    expect.assertions(5);
    const cleanup = new Cleanup(false, ['SIGINT'], 0);
    const callback = jest.fn(() => Promise.resolve());
    const mockExit = jest.fn();
    const realExit = process.exit;
    const events = [];

    process.exit = mockExit;
    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callback);
    mockExit.mockImplementation(() => {
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('SIGINT');
      expect(mockExit).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(events).toStrictEqual(['SIGINT received', 'App will exit with code 0']);
      process.exit = realExit;
      done();
    });
    process.listeners('SIGINT')[0]('SIGINT');
  });

  test('Non-rerunnable cleanup only runs once', async () => {
    expect.assertions(3);
    const cleanup = new Cleanup();
    const callback = jest.fn(() => Promise.resolve());
    const events = [];

    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callback);
    await cleanup.run('Exception 1');
    await cleanup.run('Exception 2');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Exception 1');
    expect(events).toStrictEqual(['Exception 1 received']);
  });

  test('Rerunnable cleanup runs more than once', async () => {
    expect.assertions(4);
    const cleanup = new Cleanup(true);
    const callback = jest.fn(() => Promise.resolve());
    const events = [];

    cleanup.addObservers((msg) => { events.push(msg); });
    cleanup.addCallbacks(callback);
    await cleanup.run('Exception 1');
    await cleanup.run('Exception 2');
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('Exception 1');
    expect(callback).toHaveBeenCalledWith('Exception 2');
    expect(events).toStrictEqual(['Exception 1 received', 'Exception 2 received']);
  });

  test('Rerunnable cleanup does not remove process listeners when run', async () => {
    expect.assertions(7);
    const cleanup = new Cleanup(true);

    expect(cleanup).toBeInstanceOf(Cleanup);
    expect(process.listenerCount('SIGINT')).toBe(1);
    expect(process.listenerCount('SIGQUIT')).toBe(1);
    expect(process.listenerCount('SIGTERM')).toBe(1);
    await cleanup.run();
    expect(process.listenerCount('SIGINT')).toBe(1);
    expect(process.listenerCount('SIGQUIT')).toBe(1);
    expect(process.listenerCount('SIGTERM')).toBe(1);
  });

  test('Non-rerunnable cleanup removes process listeners when run', async () => {
    expect.assertions(7);
    const cleanup = new Cleanup();

    expect(cleanup).toBeInstanceOf(Cleanup);
    expect(process.listenerCount('SIGINT')).toBe(1);
    expect(process.listenerCount('SIGQUIT')).toBe(1);
    expect(process.listenerCount('SIGTERM')).toBe(1);
    await cleanup.run();
    expect(process.listenerCount('SIGINT')).toBe(0);
    expect(process.listenerCount('SIGQUIT')).toBe(0);
    expect(process.listenerCount('SIGTERM')).toBe(0);
  });

  test('Callback runs before process exits', (done) => {
    expect.assertions(6);
    const cleanup = new Cleanup(false, ['SIGINT'], 0);
    const events = [];
    const callback = jest.fn();
    const mockExit = jest.fn();
    const realExit = process.exit;

    cleanup.addCallbacks(callback);
    callback.mockImplementation(() => new Promise((resolve) => {
      process.nextTick(() => {
        events.push('callbackResolve');
        resolve();
      });
    }));
    mockExit.mockImplementation(() => {
      events.push('processSigint');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenLastCalledWith(0);
      expect(events).toStrictEqual([
        'callbackResolve',
        'processSigint',
      ]);
      process.exit = realExit;
      done();
    });
    process.exit = mockExit;
    expect(callback).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
    process.listeners('SIGINT')[0]('SIGINT');
  });
});
