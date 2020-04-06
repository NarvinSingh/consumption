import takeAwhile from './callback.mjs';

describe('Callback implementation of an asynchronous function', () => {
  test('Fulfilled callback is executed', (done) => {
    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();

    expect.assertions(4);
    takeAwhile(2, handleFulfilled, handleRejected);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    handleFulfilled.mockImplementation(() => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleRejected).not.toHaveBeenCalled();
      done();
    });
  });

  test('Rejected callback is executed', (done) => {
    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();

    expect.assertions(4);
    takeAwhile(1, handleFulfilled, handleRejected);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    handleRejected.mockImplementation(() => {
      expect(handleFulfilled).not.toHaveBeenCalled();
      expect(handleRejected).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('Fulfilled callback has access to a result', (done) => {
    expect.assertions(1);
    takeAwhile(2, (value) => {
      expect(value).toStrictEqual({ isEven: true, input: 2 });
      done();
    });
  });

  test('Rejected callback has access to an error result', (done) => {
    expect.assertions(1);
    takeAwhile(1, null, (reason) => {
      expect(reason).toStrictEqual(new Error('The parameter is not even'));
      done();
    });
  });

  test('Fulfilled callback passes along a result', (done) => {
    const handleFulfilled = jest.fn();
    const handleFulfilled2 = jest.fn();

    expect.assertions(3);
    takeAwhile(2, handleFulfilled);
    handleFulfilled.mockImplementation(() => handleFulfilled2('done'));
    handleFulfilled2.mockImplementation((value) => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toBe('done');
      done();
    });
  });

  test('Rejected callback passes along a result', (done) => {
    const handleRejected = jest.fn();
    const handleFulfilled2 = jest.fn();

    expect.assertions(3);
    takeAwhile(1, null, handleRejected);
    handleRejected.mockImplementation(() => handleFulfilled2('done'));
    handleFulfilled2.mockImplementation((value) => {
      expect(handleRejected).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toBe('done');
      done();
    });
  });

  test('Fulfilled callback passes along an async result', (done) => {
    const handleFulfilled = jest.fn();
    const handleFulfilled2 = jest.fn();

    expect.assertions(7);
    takeAwhile(2, () => {
      takeAwhile(2, handleFulfilled);
      expect(handleFulfilled).not.toHaveBeenCalled();
      expect(handleFulfilled2).not.toHaveBeenCalled();
    });
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleFulfilled2).not.toHaveBeenCalled();
    handleFulfilled.mockImplementation(() => handleFulfilled2('done2'));
    handleFulfilled2.mockImplementation((value) => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toBe('done2');
      done();
    });
  });

  test('Rejected callback passes along an async result', (done) => {
    const handleRejected = jest.fn();
    const handleFulfilled2 = jest.fn();

    expect.assertions(7);
    takeAwhile(1, null, () => {
      takeAwhile(1, null, handleRejected);
      expect(handleRejected).not.toHaveBeenCalled();
      expect(handleFulfilled2).not.toHaveBeenCalled();
    });
    expect(handleRejected).not.toHaveBeenCalled();
    expect(handleFulfilled2).not.toHaveBeenCalled();
    handleRejected.mockImplementation(() => handleFulfilled2('done2'));
    handleFulfilled2.mockImplementation((value) => {
      expect(handleRejected).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toBe('done2');
      done();
    });
  });

  test('Multiple fulfilled and rejected callbacks execute in sequence', (done) => {
    const handleFulfilled1 = jest.fn();
    const handleRejected1 = jest.fn();
    const handleFulfilled2 = jest.fn();
    const handleRejected2 = jest.fn();
    const handleFulfilled3 = jest.fn();
    const handleRejected3 = jest.fn();

    expect.assertions(7);
    takeAwhile(2, handleFulfilled1, handleRejected1);
    handleFulfilled1.mockImplementation((value) => {
      takeAwhile(value.input + 2, handleFulfilled2, handleRejected2);
    });
    handleFulfilled2.mockImplementation((value) => {
      takeAwhile(value.input + 1, handleFulfilled3, handleRejected3);
    });
    handleRejected3.mockImplementation((reason) => {
      expect(handleFulfilled1).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(handleFulfilled3).not.toHaveBeenCalled();
      expect(handleRejected1).not.toHaveBeenCalled();
      expect(handleRejected2).not.toHaveBeenCalled();
      expect(handleRejected3).toHaveBeenCalledTimes(1);
      expect(reason).toStrictEqual(new Error('The parameter is not even'));
      done();
    });
  });
});
