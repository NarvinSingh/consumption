import takeAwhile from './callback.mjs';

describe('Callback implementation of an asynchronous function', () => {
  test('Fulfilled callback is executed', () => {
    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();

    expect.assertions(4);
    jest.useFakeTimers();
    takeAwhile(2, handleFulfilled, handleRejected);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(handleFulfilled).toHaveBeenCalledTimes(1);
    expect(handleRejected).not.toHaveBeenCalled();
  });

  test('Rejected callback is executed', () => {
    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();

    expect.assertions(4);
    jest.useFakeTimers();
    takeAwhile(1, handleFulfilled, handleRejected);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).toHaveBeenCalledTimes(1);
  });

  test('Fulfilled callback has access to a result', () => {
    const handleFulfilled = jest.fn();

    expect.assertions(1);
    jest.useFakeTimers();
    takeAwhile(2, handleFulfilled);
    jest.runOnlyPendingTimers();
    expect(handleFulfilled).toHaveBeenLastCalledWith({ isEven: true, input: 2 });
  });

  test('Rejected callback has access to an error result', () => {
    const handleRejected = jest.fn();

    expect.assertions(1);
    jest.useFakeTimers();
    takeAwhile(1, null, handleRejected);
    jest.runOnlyPendingTimers();
    expect(handleRejected).toHaveBeenLastCalledWith(new Error('The parameter is not even'));
  });

  test('Fulfilled callback passes along a result', () => {
    const handleFulfilled2 = jest.fn();
    const handleFulfilled = jest.fn(() => handleFulfilled2('done2'));

    expect.assertions(3);
    jest.useFakeTimers();
    takeAwhile(2, handleFulfilled);
    jest.runOnlyPendingTimers();
    expect(handleFulfilled).toHaveBeenCalledTimes(1);
    expect(handleFulfilled2).toHaveBeenCalledTimes(1);
    expect(handleFulfilled2).toHaveBeenLastCalledWith('done2');
  });

  test('Rejected callback passes along a result', () => {
    const handleFulfilled2 = jest.fn();
    const handleRejected = jest.fn(() => handleFulfilled2('done'));

    expect.assertions(3);
    jest.useFakeTimers();
    takeAwhile(1, null, handleRejected);
    jest.runOnlyPendingTimers();
    expect(handleRejected).toHaveBeenCalledTimes(1);
    expect(handleFulfilled2).toHaveBeenCalledTimes(1);
    expect(handleFulfilled2).toHaveBeenLastCalledWith('done');
  });

  test('Fulfilled callback passes along an async result', () => {
    const handleFulfilled2 = jest.fn();
    const handleFulfilled = jest.fn(() => handleFulfilled2('done2'));

    expect.assertions(5);
    jest.useFakeTimers();
    takeAwhile(2, () => {
      takeAwhile(2, handleFulfilled);
      expect(handleFulfilled2).not.toHaveBeenCalled();
      jest.runOnlyPendingTimers();
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenLastCalledWith('done2');
    });
    expect(handleFulfilled).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(handleFulfilled).toHaveBeenCalledTimes(1);
  });

  test('Rejected callback passes along an async result', () => {
    const handleFulfilled2 = jest.fn();
    const handleRejected = jest.fn(() => handleFulfilled2('done2'));

    expect.assertions(5);
    jest.useFakeTimers();
    takeAwhile(1, null, () => {
      takeAwhile(1, null, handleRejected);
      expect(handleFulfilled2).not.toHaveBeenCalled();
      jest.runOnlyPendingTimers();
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenLastCalledWith('done2');
    });
    expect(handleRejected).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(handleRejected).toHaveBeenCalledTimes(1);
  });

  test('Multiple fulfilled and rejected callbacks execute in sequence', () => {
    const handleRejected1 = jest.fn();
    const handleRejected2 = jest.fn();
    const handleRejected3 = jest.fn();
    const handleFulfilled3 = jest.fn();
    const handleFulfilled2 = jest.fn((result) => {
      takeAwhile(result.input + 1, handleFulfilled3, handleRejected3);
    });
    const handleFulfilled1 = jest.fn((result) => {
      takeAwhile(result.input + 2, handleFulfilled2, handleRejected2);
    });

    expect.assertions(9);
    jest.useFakeTimers();
    takeAwhile(2, handleFulfilled1, handleRejected1);
    jest.runOnlyPendingTimers();
    expect(handleFulfilled1).toHaveBeenCalledTimes(1);
    jest.runOnlyPendingTimers();
    expect(handleFulfilled2).toHaveBeenCalledTimes(1);
    jest.runAllTimers();
    expect(handleFulfilled1).toHaveBeenCalledTimes(1);
    expect(handleFulfilled2).toHaveBeenCalledTimes(1);
    expect(handleFulfilled3).not.toHaveBeenCalled();
    expect(handleRejected1).not.toHaveBeenCalled();
    expect(handleRejected2).not.toHaveBeenCalled();
    expect(handleRejected3).toHaveBeenCalledTimes(1);
    expect(handleRejected3).toHaveBeenCalledWith(new Error('The parameter is not even'));
  });
});
