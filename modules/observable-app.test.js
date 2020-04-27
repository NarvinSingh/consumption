import ObservableApp from './observable-app.mjs';

describe('ObeservableApp tests', () => {
  test('createNotification method', () => {
    const observableApp = new ObservableApp();
    const expectedNotification = {
      subject: observableApp,
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: 'event',
      data: { data: 1 },
    };
    expect(observableApp.createNotification('component', 'event', { data: 1 }))
      .toStrictEqual(expectedNotification);
  });

  test('createError method', () => {
    const observableApp = new ObservableApp();
    const expectedError = new Error('message');
    expectedError.details = {
      subject: observableApp,
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: null,
      data: { data: 1 },
    };
    const receivedError = observableApp.createError('component', 'message', { data: 1 });
    expect(receivedError).toBeInstanceOf(Error);
    expect(receivedError.message).toBe('message');
    expect(receivedError.details).toStrictEqual(expectedError.details);
  });

  test('notify method', (done) => {
    expect.assertions(1);

    const observableApp = new ObservableApp();
    const expectedNotification = {
      subject: observableApp,
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: 'event',
      data: { data: 1 },
    };
    observableApp.addObservers((notification) => {
      expect(notification).toStrictEqual(expectedNotification);
      done();
    });
    observableApp.notify('component', 'event', { data: 1 });
  });

  test('raise method', (done) => {
    expect.assertions(3);

    const observableApp = new ObservableApp();
    const expectedError = new Error('message');
    expectedError.details = {
      subject: observableApp,
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: null,
      data: { data: 1 },
    };
    observableApp.addObservers((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('message');
      expect(error.details).toStrictEqual(expectedError.details);
      done();
    });
    observableApp.raise('component', 'message', { data: 1 });
  });

  test('makeNotificationCreator method', () => {
    const observableApp = new ObservableApp();
    const expectedNotification = {
      subject: observableApp,
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: 'event',
      data: { data: 1 },
    };
    const notify = observableApp.makeNotificationCreator('component');
    expect(notify('event', { data: 1 })).toStrictEqual(expectedNotification);
  });

  test('makeErrorCreator method', () => {
    const observableApp = new ObservableApp();
    const expectedError = new Error('message');
    expectedError.details = {
      subject: observableApp,
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: null,
      data: { data: 1 },
    };
    const raise = observableApp.makeErrorCreator('component');
    const receivedError = raise('message', { data: 1 });
    expect(receivedError).toBeInstanceOf(Error);
    expect(receivedError.message).toBe('message');
    expect(receivedError.details).toStrictEqual(expectedError.details);
  });

  test('makeNotifier method', (done) => {
    expect.assertions(1);

    const observableApp = new ObservableApp();
    const expectedNotification = {
      subject: observableApp,
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: 'event',
      data: { data: 1 },
    };
    const notify = observableApp.makeNotifier('component');
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
      subject: observableApp,
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: null,
      data: { data: 1 },
    };
    const raise = observableApp.makeRaiser('component');
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
    const notification = observableApp.createNotification('component', 'event', { data: 1 });
    const expectedSummary = {
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: 'event',
      data: { data: 1 },
    };
    expect(ObservableApp.summarize(notification)).toStrictEqual(expectedSummary);

    const error = observableApp.createError('component', 'message', { data: 1 });
    const expectedErrSummary = {
      subjectName: 'ObservableApp',
      componentName: 'component',
      event: 'message',
      data: { data: 1 },
    };
    expect(ObservableApp.summarize(error)).toStrictEqual(expectedErrSummary);

    const error2 = observableApp.createError('subComponent', 'message', { data: 1 });
    const errNotification2 = observableApp.createNotification('component', error2);
    const expectedErrSummary2 = {
      subjectName: 'ObservableApp',
      componentName: 'subComponent',
      event: 'message',
      data: { data: 1 },
    };
    expect(ObservableApp.summarize(errNotification2)).toStrictEqual(expectedErrSummary2);
  });
});
