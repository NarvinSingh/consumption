import takeAwhile from './promise.mjs';

describe('Promise implementation of an asynchronous function', () => {
  test('Fulfilled handler is executed', (done) => {
    jest.useFakeTimers();

    const promise = takeAwhile(2);
    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();

    expect.assertions(4);
    promise.then(handleFulfilled).catch(handleRejected);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    promise.then(() => {
      expect(handleFulfilled).toHaveBeenCalledTimes(1);
      expect(handleRejected).not.toHaveBeenCalled();
      done();
    });
  });

  test('Rejected handler is executed', (done) => {
    jest.useFakeTimers();

    const promise = takeAwhile(1);
    const handleFulfilled = jest.fn();
    const handleRejected = jest.fn();
    const promise2 = promise.then(handleFulfilled).catch(handleRejected);

    expect.assertions(4);
    expect(handleFulfilled).not.toHaveBeenCalled();
    expect(handleRejected).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    promise2.then(() => {
      expect(handleFulfilled).not.toHaveBeenCalled();
      expect(handleRejected).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('Fulfilled handler has access to a result', (done) => {
    jest.useFakeTimers();

    const promise = takeAwhile(2);
    const handleFulfilled = jest.fn();

    expect.assertions(1);
    jest.runOnlyPendingTimers();
    promise.then(handleFulfilled).then(() => {
      expect(handleFulfilled).toHaveBeenLastCalledWith({ isEven: true, input: 2 });
      done();
    });
  });

  test('Rejected handler has access to an error result', (done) => {
    jest.useFakeTimers();

    const promise = takeAwhile(1);
    const handleRejected = jest.fn();
    const promise2 = promise.catch(handleRejected);

    expect.assertions(1);
    jest.runOnlyPendingTimers();
    promise2.then(() => {
      expect(handleRejected).toHaveBeenLastCalledWith(new Error('The parameter is not even'));
      done();
    });
  });

  test('Fulfilled handler passes along a result', (done) => {
    const promise = new Promise((resolve) => resolve('done1'));
    const handleFulfilled = jest.fn(() => 'done2');

    expect.assertions(1);
    promise.then(handleFulfilled).then((value) => {
      expect(value).toBe('done2');
      done();
    });
  });

  test('Rejected handler passes along a result', (done) => {
    const promise = new Promise((resolve, reject) => reject(new Error('error')));
    const handleRejected = jest.fn(() => 'done');

    expect.assertions(1);
    promise.catch(handleRejected).then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Fulfilled handler passes along a promise result', (done) => {
    const promise = new Promise((resolve) => resolve('done1'));
    const handleFulfilled = jest.fn(() => new Promise((resolve) => resolve('done2')));

    expect.assertions(1);
    promise.then(handleFulfilled).then((value) => {
      expect(value).toBe('done2');
      done();
    });
  });

  test('Rejected handler passes along a promise result', (done) => {
    const promise = new Promise((resolve, reject) => reject(new Error('error')));
    const handleRejected = jest.fn(() => new Promise((resolve) => resolve('done')));

    expect.assertions(1);
    promise.catch(handleRejected).then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Multiple fulfilled and rejected handlers execute in sequence', (done) => {
    jest.useFakeTimers();

    const promise = takeAwhile(2);
    jest.runOnlyPendingTimers();

    const handleFulfilled1 = jest.fn((result) => {
      const promise2 = takeAwhile(result.input + 2);

      jest.runOnlyPendingTimers();

      return promise2;
    });
    const handleFulfilled2 = jest.fn((result) => {
      const promise3 = takeAwhile(result.input + 1);

      jest.runOnlyPendingTimers();

      return promise3;
    });
    const handleFulfilled3 = jest.fn();
    const handleRejected = jest.fn();

    expect.assertions(5);
    promise
      .then(handleFulfilled1)
      .then(handleFulfilled2)
      .then(handleFulfilled3)
      .catch(handleRejected)
      .then(() => {
        expect(handleFulfilled1).toHaveBeenCalledTimes(1);
        expect(handleFulfilled2).toHaveBeenCalledTimes(1);
        expect(handleFulfilled3).not.toHaveBeenCalled();
        expect(handleRejected).toHaveBeenCalledTimes(1);
        expect(handleRejected).toHaveBeenCalledWith(new Error('The parameter is not even'));
        done();
      });
  });
});
