import takeAwhile from './promise.mjs';

describe('Promise implementation of an asynchronous function', () => {
  test('resolve callback is executed', () => {
    const resolve = jest.fn();
    const reject = jest.fn();

    jest.useFakeTimers();
    takeAwhile(2).then(resolve).catch(reject);
    expect(resolve).not.toHaveBeenCalled();
    expect(reject).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
  });

  test('reject callback is executed', () => {
    const resolve = jest.fn();
    const reject = jest.fn();

    jest.useFakeTimers();
    takeAwhile(1).then(resolve).catch(reject);
    expect(resolve).not.toHaveBeenCalled();
    expect(reject).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalledTimes(1);
  });

  test('resolve callback has access to a result', () => {
    const resolve = jest.fn();
    const reject = jest.fn();

    jest.useFakeTimers();
    takeAwhile(2).then(resolve).catch(reject);
    jest.runOnlyPendingTimers();
    expect(resolve).toHaveBeenLastCalledWith({ isEven: true, input: 2 });
  });

  test('reject callback has access to an error result', () => {
    const resolve = jest.fn();
    const reject = jest.fn();

    jest.useFakeTimers();
    takeAwhile(1, resolve, reject);
    jest.runOnlyPendingTimers();
    expect(reject).toHaveBeenLastCalledWith({ isEven: false, input: 1 });
  });

  test('Multiple resolve and reject callbacks execute in sequence', () => {
    const resolve1 = jest.fn((result) => takeAwhile(result.input + 2));
    const resolve2 = jest.fn((result) => takeAwhile(result.input + 1));
    const resolve3 = jest.fn();
    const reject = jest.fn();

    jest.useFakeTimers();
    takeAwhile(2)
      .then(resolve1)
      .then(resolve2)
      .then(resolve2)
      .catch(reject);
    jest.runOnlyPendingTimers();
    expect(resolve1).toHaveBeenCalledTimes(1);
    jest.runOnlyPendingTimers();
    expect(resolve2).toHaveBeenCalledTimes(1);
    jest.runAllTimers();
    expect(resolve1).toHaveBeenCalledTimes(1);
    expect(resolve2).toHaveBeenCalledTimes(1);
    expect(resolve3).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalledTimes(1);
  });
});
