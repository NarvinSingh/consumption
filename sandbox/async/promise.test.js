import takeAwhile from './promise.mjs';

describe('Promise implementation of an asynchronous function', () => {
  test('Promise resolves', () => {
    expect.assertions(1);
    return expect(takeAwhile(2)).resolves.toStrictEqual({ isEven: true, input: 2 });
  });

  test('Promise rejects', () => {
    expect.assertions(1);
    return expect(takeAwhile(1)).rejects.toStrictEqual(new Error('The parameter is not even: 1'));
  });

  test('Fulfilled handler is executed', (done) => {
    expect.assertions(4);

    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();
    const promise = takeAwhile(2);

    promise.then(handleFulfilled).catch(handleRejected);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    promise.then(() => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleRejected).not.toHaveBeenCalled();
      done();
    });
  });

  test('Rejected handler is executed', (done) => {
    expect.assertions(4);

    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();
    const promise = takeAwhile(1).then(handleFulfilled).catch(handleRejected);

    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    promise.then(() => {
      expect(handleFulfilled).not.toHaveBeenCalled();
      expect(handleRejected).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('Fulfilled handler has access to a result', (done) => {
    expect.assertions(1);

    const handleFulfilled = jest.fn();

    takeAwhile(2).then(handleFulfilled).then(() => {
      expect(handleFulfilled).toHaveBeenLastCalledWith({ isEven: true, input: 2 });
      done();
    });
  });

  test('Rejected handler has access to an error result', (done) => {
    expect.assertions(1);

    const handleRejected = jest.fn();

    takeAwhile(1).catch(handleRejected).then(() => {
      expect(handleRejected).toHaveBeenLastCalledWith(new Error('The parameter is not even: 1'));
      done();
    });
  });

  test('Fulfilled handler passes along a result', (done) => {
    expect.assertions(3);

    const handleFulfilled = jest.fn();
    const handleFulfilled2 = jest.fn();

    takeAwhile(2).then(handleFulfilled);
    handleFulfilled.mockImplementation((value) => handleFulfilled2(`${value.input} -> done`));
    handleFulfilled2.mockImplementation((value) => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toBe('2 -> done');
      done();
    });
  });

  test('Rejected handler passes along a result', (done) => {
    expect.assertions(3);

    const handleRejected = jest.fn();
    const handleFulfilled2 = jest.fn();

    takeAwhile(1).catch(handleRejected);
    handleRejected.mockImplementation((reason) => handleFulfilled2(`${reason.message} -> done`));
    handleFulfilled2.mockImplementation((value) => {
      expect(handleRejected).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toBe('The parameter is not even: 1 -> done');
      done();
    });
  });

  test('Fulfilled handler passes along a promise result', (done) => {
    expect.assertions(7);

    const handleFulfilled = jest.fn();
    const handleFulfilled2 = jest.fn();

    takeAwhile(2).then(handleFulfilled).then(handleFulfilled2);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleFulfilled2).not.toHaveBeenCalled();
    handleFulfilled.mockImplementation((value) => {
      const promise = takeAwhile(value.input + 2);
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).not.toHaveBeenCalled();

      return promise;
    });
    handleFulfilled2.mockImplementation((value) => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toStrictEqual({ input: 4, isEven: true });
      done();
    });
  });

  test('Rejected handler passes along a promise result', (done) => {
    expect.assertions(7);

    const handleRejected = jest.fn();
    const handleFulfilled2 = jest.fn();

    takeAwhile(1).catch(handleRejected).then(handleFulfilled2);
    expect(handleRejected).not.toHaveBeenCalled();
    expect(handleFulfilled2).not.toHaveBeenCalled();
    handleRejected.mockImplementation((reason) => {
      const promise = takeAwhile(parseInt(reason.message.split(': ').pop(), 10) + 1);
      expect(handleRejected).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).not.toHaveBeenCalled();

      return promise;
    });
    handleFulfilled2.mockImplementation((value) => {
      expect(handleRejected).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value).toStrictEqual({ input: 2, isEven: true });
      done();
    });
  });

  test('Multiple fulfilled and rejected handlers execute in sequence', (done) => {
    expect.assertions(5);

    const handleFulfilled1 = jest.fn();
    const handleFulfilled2 = jest.fn();
    const handleFulfilled3 = jest.fn();
    const handleRejected3 = jest.fn();

    takeAwhile(2)
      .then(handleFulfilled1)
      .then(handleFulfilled2)
      .then(handleFulfilled3)
      .catch(handleRejected3);
    handleFulfilled1.mockImplementation((value) => takeAwhile(value.input + 2));
    handleFulfilled2.mockImplementation((value) => takeAwhile(value.input + 1));
    handleRejected3.mockImplementation((reason) => {
      expect(handleFulfilled1).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(handleFulfilled3).not.toHaveBeenCalled();
      expect(handleRejected3).toHaveBeenCalledTimes(1);
      expect(reason).toStrictEqual(new Error('The parameter is not even: 5'));
      done();
    });
  });
});
