import { promisify } from './utils.mjs';

describe('promisify tests', () => {
  test('Promisify a function that succeeds', async () => {
    expect.assertions(2);

    const fn = jest.fn((callback) => {
      setImmediate(() => { callback(null, 'resolved'); });
    });
    const fnPromise = promisify(fn);
    const value = await fnPromise();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(value).toBe('resolved');
  });

  test('Promisify a function that fails', async () => {
    expect.assertions(3);

    const fn = jest.fn((callback) => {
      setImmediate(() => { callback(new Error('rejected')); });
    });
    const fnPromise = promisify(fn);

    try {
      await fnPromise();
    } catch (err) {
      expect(fn).toHaveBeenCalledTimes(1);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('rejected');
    }
  });

  test('Promisify a function that takes multiple arguments', async () => {
    expect.assertions(2);

    const fn = jest.fn((value1, value2, callback) => {
      setImmediate(() => { callback(null, `resolved ${value1} and ${value2}`); });
    });
    const fnPromise = promisify(fn);
    const value = await fnPromise(1, 2);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(value).toBe('resolved 1 and 2');
  });

  test('Promisify a function that takes a variable number of arguments', async () => {
    expect.assertions(2);

    const fn = jest.fn((...rest) => {
      setImmediate(() => {
        const callback = rest.pop();
        callback(null, `resolved ${rest.join(', ')}`);
      });
    });
    const fnPromise = promisify(fn);
    const value = await fnPromise(1, 2, 3);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(value).toBe('resolved 1, 2, 3');
  });

  test('Promisify a function that has access to a context', async () => {
    expect.assertions(3);

    const fn = jest.fn(function fn(callback) {
      const { value } = this;
      setImmediate(() => { callback(null, `resolved ${value}`); });
    });
    const obj = { value: 1, fn };
    const fnPromise = promisify(fn, obj);
    const value = await fnPromise();
    obj.fnPromise = promisify(obj.fn, obj);
    const value2 = await obj.fnPromise();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(value).toBe('resolved 1');
    expect(value2).toBe('resolved 1');
  });
});
