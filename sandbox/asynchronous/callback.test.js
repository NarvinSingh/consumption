import takeAwhile from './callback.mjs';

describe('Callback implementation of an asynchronous function', () => {
  test('Callback is executed', () => {
    const callback = jest.fn();

    jest.useFakeTimers();
    takeAwhile(null, callback);
    expect(callback).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('Callback has access to the input parameter', () => {
    const callback = jest.fn();
    const input = { name: 'test' };

    jest.useFakeTimers();
    takeAwhile(input, callback);
    jest.runOnlyPendingTimers();
    expect(callback).toHaveBeenLastCalledWith({ done: true, input });
  });

  test('Callback executes the next task', () => {
    const callbackNext = jest.fn();
    const callback = jest.fn(() => takeAwhile(null, callbackNext));

    jest.useFakeTimers();
    takeAwhile(null, callback);
    jest.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callbackNext).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(callbackNext).toHaveBeenCalledTimes(1);
  });
});
