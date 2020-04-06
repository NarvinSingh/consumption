import takeAwhile from './callback.mjs';

describe('Callback implementation of an asynchronous function', () => {
  test('Fulfilled callback is executed', (done) => {
    expect.assertions(4);

    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();

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
    expect.assertions(4);

    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();

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
      expect(reason).toStrictEqual(new Error('The parameter is not even: 1'));
      done();
    });
  });

  test('Fulfilled callback passes along a result', (done) => {
    expect.assertions(3);

    const handleFulfilled = jest.fn();
    const handleFulfilled2 = jest.fn();

    takeAwhile(2, handleFulfilled);
    handleFulfilled.mockImplementation((value) => handleFulfilled2(`${value.input} -> done`));
    handleFulfilled2.mockImplementation((value) => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toBe('2 -> done');
      done();
    });
  });

  test('Rejected callback passes along a result', (done) => {
    expect.assertions(3);

    const handleRejected = jest.fn();
    const handleFulfilled2 = jest.fn();

    takeAwhile(1, null, handleRejected);
    handleRejected.mockImplementation((reason) => handleFulfilled2(`${reason.message} -> done`));
    handleFulfilled2.mockImplementation((value) => {
      expect(handleRejected).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toBe('The parameter is not even: 1 -> done');
      done();
    });
  });

  test('Fulfilled callback passes along an async result', (done) => {
    expect.assertions(7);

    const handleFulfilled = jest.fn();
    const handleFulfilled2 = jest.fn();

    takeAwhile(2, handleFulfilled);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleFulfilled2).not.toHaveBeenCalled();
    handleFulfilled.mockImplementation((value) => {
      takeAwhile(value.input + 2, handleFulfilled2);
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).not.toHaveBeenCalled();
    });
    handleFulfilled2.mockImplementation((value) => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toStrictEqual({ input: 4, isEven: true });
      done();
    });
  });

  test('Rejected callback passes along an async result', (done) => {
    expect.assertions(7);

    const handleRejected = jest.fn();
    const handleFulfilled2 = jest.fn();

    takeAwhile(1, null, handleRejected);
    expect(handleRejected).not.toHaveBeenCalled();
    expect(handleFulfilled2).not.toHaveBeenCalled();
    handleRejected.mockImplementation((reason) => {
      takeAwhile(parseInt(reason.message.split(': ').pop(), 10) + 1, handleFulfilled2);
      expect(handleRejected).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).not.toHaveBeenCalled();
    });
    handleFulfilled2.mockImplementation((value) => {
      expect(handleRejected).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toStrictEqual({ input: 2, isEven: true });
      done();
    });
  });

  test('Multiple fulfilled and rejected callbacks execute in sequence', (done) => {
    expect.assertions(7);

    const handleFulfilled1 = jest.fn();
    const handleRejected1 = jest.fn();
    const handleFulfilled2 = jest.fn();
    const handleRejected2 = jest.fn();
    const handleFulfilled3 = jest.fn();
    const handleRejected3 = jest.fn();

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
      expect(reason).toStrictEqual(new Error('The parameter is not even: 5'));
      done();
    });
  });
});
