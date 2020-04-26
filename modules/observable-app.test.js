import ObservableApp from './observable-app.mjs';

describe('ObeservableApp tests', () => {
  test('createNotification method', () => {
    const observableApp = new ObservableApp();
    const expectedNotification = {
      app: observableApp,
      componentType: 'type',
      componentName: 'name',
      event: 'event',
      data: { data: 1 },
    };
    expect(observableApp.createNotification('type', 'name', 'event', { data: 1 }))
      .toStrictEqual(expectedNotification);
  });

  test('createError method', () => {
    const observableApp = new ObservableApp();
    const expectedError = new Error('message');
    expectedError.details = {
      app: observableApp,
      componentType: 'type',
      componentName: 'name',
      event: null,
      data: { data: 1 },
    };
    const receivedError = observableApp.createError('type', 'name', 'message', { data: 1 });
    expect(receivedError).toBeInstanceOf(Error);
    expect(receivedError.message).toBe('message');
    expect(receivedError.details).toStrictEqual(expectedError.details);
  });

  test('notify method', (done) => {
    expect.assertions(1);

    const observableApp = new ObservableApp();
    const expectedNotification = {
      app: observableApp,
      componentType: 'type',
      componentName: 'name',
      event: 'event',
      data: { data: 1 },
    };
    observableApp.addObservers((notification) => {
      expect(notification).toStrictEqual(expectedNotification);
      done();
    });
    observableApp.notify('type', 'name', 'event', { data: 1 });
  });

  test('raise method', (done) => {
    expect.assertions(3);

    const observableApp = new ObservableApp();
    const expectedError = new Error('message');
    expectedError.details = {
      app: observableApp,
      componentType: 'type',
      componentName: 'name',
      event: null,
      data: { data: 1 },
    };
    observableApp.addObservers((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('message');
      expect(error.details).toStrictEqual(expectedError.details);
      done();
    });
    observableApp.raise('type', 'name', 'message', { data: 1 });
  });

  test('makeNotificationCreator method', () => {
    const observableApp = new ObservableApp();
    const expectedNotification = {
      app: observableApp,
      componentType: 'type',
      componentName: 'name',
      event: 'event',
      data: { data: 1 },
    };
    const notify = observableApp.makeNotificationCreator('type', 'name');
    expect(notify('event', { data: 1 })).toStrictEqual(expectedNotification);
  });

  test('makeErrorCreator method', () => {
    const observableApp = new ObservableApp();
    const expectedError = new Error('message');
    expectedError.details = {
      app: observableApp,
      componentType: 'type',
      componentName: 'name',
      event: null,
      data: { data: 1 },
    };
    const raise = observableApp.makeErrorCreator('type', 'name');
    const receivedError = raise('message', { data: 1 });
    expect(receivedError).toBeInstanceOf(Error);
    expect(receivedError.message).toBe('message');
    expect(receivedError.details).toStrictEqual(expectedError.details);
  });

  test('makeNotifier method', (done) => {
    expect.assertions(1);

    const observableApp = new ObservableApp();
    const expectedNotification = {
      app: observableApp,
      componentType: 'type',
      componentName: 'name',
      event: 'event',
      data: { data: 1 },
    };
    const notify = observableApp.makeNotifier('type', 'name');
    observableApp.addObservers((notification) => {
      expect(notification).toStrictEqual(expectedNotification);
      done();
    });
    notify('event', { data: 1 });
  });

  test('makeRaiser method', (done) => {
    expect.assertions(3);

    const observableApp = new ObservableApp();
    const expectedError = new Error('message');
    expectedError.details = {
      app: observableApp,
      componentType: 'type',
      componentName: 'name',
      event: null,
      data: { data: 1 },
    };
    const raise = observableApp.makeRaiser('type', 'name');
    observableApp.addObservers((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('message');
      expect(error.details).toStrictEqual(expectedError.details);
      done();
    });
    raise('message', { data: 1 });
  });

  test('summarize static method', () => {
    const observableApp = new ObservableApp();
    const notification = observableApp.createNotification('type', 'name', 'event', { data: 1 });
    const expectedSummary = { type: 'type', name: 'name', event: 'event', data: { data: 1 } };
    expect(ObservableApp.summarize(notification)).toStrictEqual(expectedSummary);

    const error = observableApp.createError('type', 'name', 'message', { data: 1 });
    const expectedErrSummary = { type: 'type', name: 'name', event: 'message', data: { data: 1 } };
    expect(ObservableApp.summarize(error)).toStrictEqual(expectedErrSummary);

    const error2 = observableApp.createError('subtype', 'subname', 'message', { data: 1 });
    const errNotification2 = observableApp.createNotification(
      'type',
      'name',
      error2.message,
      error2,
    );
    const expectedErrSummary2 = {
      type: 'subtype',
      name: 'subname',
      event: 'message',
      data: { data: 1 },
    };
    expect(ObservableApp.summarize(errNotification2)).toStrictEqual(expectedErrSummary2);
  });
});
