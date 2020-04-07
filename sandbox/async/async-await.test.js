import takeAwhile from './promise.mjs';

describe('Promise implementation of an asynchronous function', () => {
  test('Not awaiting an async function returns a promise', () => {
    expect.assertions(1);
    expect(takeAwhile(2)).toBeInstanceOf(Promise);
  });

  test('Awaiting an async function returns a value', async () => {
    expect.assertions(1);
    expect(await takeAwhile(2)).toStrictEqual({ isEven: true, input: 2 });
  });

  test('Fulfilled handler is executed', async () => {
    expect.assertions(4);

    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();
    const value = await takeAwhile(2);

    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    handleFulfilled(value);
    expect(handleFulfilled).toHaveBeenCalledTimes(1);
    expect(handleRejected).not.toHaveBeenCalled();
  });

  test('Rejected handler is executed', async () => {
    expect.assertions(2);

    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();

    try {
      await takeAwhile(1);
      expect(handleFulfilled).not.toHaveBeenCalled();
      expect(handleRejected).not.toHaveBeenCalled();
    } catch (err) {
      handleRejected(err);
      expect(handleFulfilled).not.toHaveBeenCalled();
      expect(handleRejected).toHaveBeenCalledTimes(1);
    }
  });

  test('Fulfilled handler has access to a result', async () => {
    expect.assertions(1);

    const handleFulfilled = jest.fn();
    const value = await takeAwhile(2);

    handleFulfilled(value);
    expect(handleFulfilled).toHaveBeenLastCalledWith({ isEven: true, input: 2 });
  });

  test('Rejected handler has access to an error result', async () => {
    expect.assertions(1);

    const handleRejected = jest.fn();

    try {
      await takeAwhile(1);
    } catch (err) {
      handleRejected(err);
      expect(handleRejected).toHaveBeenLastCalledWith(new Error('The parameter is not even: 1'));
    }
  });

  test('Fulfilled handler passes along a result', async () => {
    expect.assertions(3);

    const handleFulfilled = jest.fn();
    const handleFulfilled2 = jest.fn();
    const value = await takeAwhile(2);

    handleFulfilled.mockImplementation((value1) => handleFulfilled2(`${value1.input} -> done`));
    handleFulfilled2.mockImplementation((value2) => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value2).toBe('2 -> done');
    });
    handleFulfilled(value);
  });

  test('Rejected handler passes along a result', async () => {
    expect.assertions(3);

    const handleRejected = jest.fn();
    const handleFulfilled2 = jest.fn();

    try {
      await takeAwhile(1);
    } catch (err) {
      handleRejected.mockImplementation((reason) => handleFulfilled2(`${reason.message} -> done`));
      handleFulfilled2.mockImplementation((value) => {
        expect(handleRejected).toHaveBeenCalledTimes(1);
        expect(handleFulfilled2).toHaveBeenCalledTimes(1);
        expect(value).toBe('The parameter is not even: 1 -> done');
      });
      handleRejected(err);
    }
  });

  test('Fulfilled handler passes along a promise result', async () => {
    expect.assertions(7);

    const handleFulfilled = jest.fn();
    const handleFulfilled2 = jest.fn();
    const value = await takeAwhile(2);

    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleFulfilled2).not.toHaveBeenCalled();
    handleFulfilled.mockImplementation((value1) => {
      const promise = takeAwhile(value1.input + 2);
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).not.toHaveBeenCalled();

      return promise;
    });
    handleFulfilled2.mockImplementation((value2) => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(value2).toStrictEqual({ input: 4, isEven: true });
    });
    handleFulfilled2(await handleFulfilled(value));
  });

  test('Rejected handler passes along a promise result', async () => {
    expect.assertions(5);

    const handleRejected = jest.fn();
    const handleFulfilled2 = jest.fn();

    try {
      await takeAwhile(1);
      expect(handleRejected).not.toHaveBeenCalled();
      expect(handleFulfilled2).not.toHaveBeenCalled();
    } catch (err) {
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
      });
      handleFulfilled2(await handleRejected(err));
    }
  });

  test('Multiple fulfilled and rejected handlers execute in sequence', async () => {
    expect.assertions(5);

    const handleFulfilled1 = jest.fn((value) => takeAwhile(value.input + 2));
    const handleFulfilled2 = jest.fn((value) => takeAwhile(value.input + 1));
    const handleFulfilled3 = jest.fn();
    const handleRejected3 = jest.fn((reason) => {
      expect(handleFulfilled1).toHaveBeenCalledTimes(1);
      expect(handleFulfilled2).toHaveBeenCalledTimes(1);
      expect(handleFulfilled3).not.toHaveBeenCalled();
      expect(handleRejected3).toHaveBeenCalledTimes(1);
      expect(reason).toStrictEqual(new Error('The parameter is not even: 5'));
    });

    try {
      const value = await takeAwhile(2);
      const value2 = await handleFulfilled1(value);
      const value3 = await handleFulfilled2(value2);

      await handleFulfilled2(value3);
    } catch (err) {
      handleRejected3(err);
    }
  });
});
