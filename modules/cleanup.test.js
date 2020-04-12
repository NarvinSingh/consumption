import Cleanup from './cleanup.mjs';

describe('Cleanup class tests', () => {
  test('Insantiate class with default parameter and add process listenters', () => {
    expect.assertions(6);
    const cleanup = new Cleanup();

    expect(cleanup).toBeInstanceOf(Cleanup);
    expect(cleanup.signals).toStrictEqual(['SIGINT', 'SIGQUIT', 'SIGTERM']);
    expect(cleanup.callbacks).toStrictEqual([]);
    expect(process.listenerCount('SIGINT')).toBe(1);
    expect(process.listenerCount('SIGQUIT')).toBe(1);
    expect(process.listenerCount('SIGTERM')).toBe(1);
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

  test('Run cleanup with a single callback', async () => {
    expect.assertions(4);
    const cleanup = new Cleanup();
    const callback = jest.fn(() => Promise.resolve());
    const mockExit = jest.fn();
    const realExit = process.exit;

    process.exit = mockExit;
    cleanup.addCallbacks(callback);
    await cleanup.run('Exception');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Exception');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
    process.exit = realExit;
  });

  test('Run cleanup with multiple callbacks', async () => {
    expect.assertions(6);
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
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
    process.exit = realExit;
  });
});
