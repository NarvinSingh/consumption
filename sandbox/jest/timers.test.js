describe('Fake timer tests', () => {
  test('Real timer runs after stack code', (done) => {
    const events = [];

    expect.assertions(1); // guard agains false positives
    jest.useRealTimers();
    setTimeout(() => {
      events.push(2);
      expect(events).toStrictEqual([1, 2]);
      done();
    }, 0);
    events.push(1);
  });

  test('Fake timer runs before other stack code', () => {
    const events = [];

    expect.assertions(1); // guard agains false positives
    jest.useFakeTimers();
    setTimeout(() => events.push(2), 5000);
    jest.runOnlyPendingTimers();
    events.push(1);
    expect(events).toStrictEqual([2, 1]);
  });

  test('Fake timer is only created after jest.useFakeTimers is called', (done) => {
    const events = [];

    expect.assertions(1); // guard agains false positives
    jest.useRealTimers();
    setTimeout(() => {
      events.push(2);
      expect(events).toStrictEqual([3, 1, 2]);
      done();
    }, 0);
    jest.useFakeTimers();
    setTimeout(() => events.push(3), 5000);
    jest.runOnlyPendingTimers();
    events.push(1);
  });

  test('Fake timer will not run without a jest timer method being called', (done) => {
    const events = [];

    expect.assertions(1); // guard agains false positives
    jest.useFakeTimers();
    setTimeout(() => {
      events.push(1);
      expect(events).toStrictEqual([1]);
      done();
    }, 0);
    jest.useRealTimers();
    setTimeout(() => {
      events.push(2);
      expect(events).toStrictEqual([2]);
      done();
    }, 250);
  });
});
