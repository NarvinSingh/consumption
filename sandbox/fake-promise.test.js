import FakePromise from './fake-promise.mjs';

describe('Fake promise tests', () => {
  test('Resolve promise with executor that runs synchronous code', (done) => {
    const promise = new FakePromise((resolve) => {
      resolve('done');
    });

    promise.then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Resolve promise with executor that runs asynchronous task code', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => resolve('done'), 0);
    });

    promise.then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Resolve promise with executor that runs asynchronous microtask code', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => resolve('done'));
    });

    promise.then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Executor synchronous code runs immediately', (done) => {
    const events = [];

    const promise = new FakePromise((resolve) => {
      events.push('promise executor running');
      resolve('done');
    });

    events.push('promise created');
    expect(events).toStrictEqual(['promise executor running', 'promise created']);
    promise.then(() => {
      expect(events).toStrictEqual(['promise executor running', 'promise created']);
      done();
    });
  });

  test('Executor asynchronous task code runs after synchronous code', (done) => {
    const events = [];

    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        events.push('promise executor running');
        resolve('done');
      }, 0);
    });

    events.push('promise created');
    expect(events).toStrictEqual(['promise created']);
    promise.then(() => {
      expect(events).toStrictEqual(['promise created', 'promise executor running']);
      done();
    });
  });

  test('Executor asynchronous microtask code runs after synchronous code', (done) => {
    const events = [];

    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        events.push('promise executor running');
        resolve('done');
      });
    });

    events.push('promise created');
    expect(events).toStrictEqual(['promise created']);
    promise.then(() => {
      expect(events).toStrictEqual(['promise created', 'promise executor running']);
      done();
    });
  });

  test('Promise is only resolved once (sync executor)', (done) => {
    const events = [];

    const promise = new FakePromise((resolve) => {
      events.push('promise executor running');
      resolve('done 1');
      resolve('done 2');
    });

    events.push('promise created');
    expect(events).toStrictEqual(['promise executor running', 'promise created']);
    promise.then((value) => {
      expect(value).toBe('done 1');
      expect(events).toStrictEqual(['promise executor running', 'promise created']);
      done();
    });
  });

  test('Promise is only resolved once (async executor)', (done) => {
    const events = [];

    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        events.push('promise executor running');
        resolve('done 1');
        resolve('done 2');
      }, 0);
    });

    events.push('promise created');
    expect(events).toStrictEqual(['promise created']);
    promise.then((value) => {
      expect(value).toBe('done 1');
      expect(events).toStrictEqual(['promise created', 'promise executor running']);
      done();
    });
  });

  test('Promise is only resolved once (microtask executor)', (done) => {
    const events = [];

    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        events.push('promise executor running');
        resolve('done 1');
        resolve('done 2');
      });
    });

    events.push('promise created');
    expect(events).toStrictEqual(['promise created']);
    promise.then((value) => {
      expect(value).toBe('done 1');
      expect(events).toStrictEqual(['promise created', 'promise executor running']);
      done();
    });
  });

  test('Reject promise (sync executor)', (done) => {
    const promise = new FakePromise((resolve, reject) => {
      reject('error');
    });

    promise.catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Reject promise (async executor)', (done) => {
    const promise = new FakePromise((resolve, reject) => {
      setTimeout(() => {
        reject('error');
      }, 0);
    });

    promise.catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Reject promise (microtask executor)', (done) => {
    const promise = new FakePromise((resolve, reject) => {
      process.nextTick(() => {
        reject('error');
      });
    });

    promise.catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Catch rejected promise with error thrown by handler (sync executor)', (done) => {
    // Sequence of events:
    //  resolve promise 0
    //    set state to fulfilled
    //    set value to string 'done'
    //    try to settle
    //  fail to settle promise 0 (then not called yet)
    //  call then with fulfilled handler
    //    set fullfilled handler of promise 0
    //    create promise 1 (noop executor doesn't resolve or reject)
    //    try to settle promise 0
    //    queue task to settle promise 0
    //    return promise 1 from then
    //  call catch with rejected handler
    //    set rejected handler of promise 1
    //    create promise 2 (noop executor doesn't resolve or reject)
    //    try to settle promise 1
    //    fail to settle promise 1 (status is pending)
    //    return promise 2 from catch
    //  run queued task to settle promise 0
    //    call promise 0 fulfilled handler which throws an error
    //    catch error and reject promise 1 with the error
    //      set promise 1 state to rejected
    //      set promise 1 value to error
    //      try to settle promise 1
    //      queue task to settle promise 1
    //  run queued task to settle promise 1
    //    call promise 1 rejected handler which ends the test
    //    resolve promise 2 with undefined
    //    set promise 2 state to fulfilled
    //    set promise 2 value to undefined
    //    try to settle promise 2
    //    fail to settle promise 2 (then or catch not called yet)
    const promise = new FakePromise((resolve) => {
      resolve('done');
    });

    promise.then(() => {
      throw new Error('thrown error');
    }).catch((reason) => {
      expect(reason.message).toBe('thrown error');
      done();
    });
  });

  test('Catch rejected promise with error thrown by handler (async executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done');
      }, 0);
    });

    promise.then(() => {
      throw new Error('thrown error');
    }).catch((reason) => {
      expect(reason.message).toBe('thrown error');
      done();
    });
  });

  test('Catch rejected promise with error thrown by handler (microtask executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done');
      });
    });

    promise.then(() => {
      throw new Error('thrown error');
    }).catch((reason) => {
      expect(reason.message).toBe('thrown error');
      done();
    });
  });

  test('Returned promise resolves to value from handler (sync executor)', (done) => {
    const promise = new FakePromise((resolve) => resolve('done'));
    const returnedPromise = promise.then((value) => `value is ${value}`);

    returnedPromise.then((value) => {
      expect(value).toBe('value is done');
      done();
    });
  });

  test('Returned promise resolves to value from handler (async executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done');
      }, 0);
    });
    const returnedPromise = promise.then((value) => `value is ${value}`);

    returnedPromise.then((value) => {
      expect(value).toBe('value is done');
      done();
    });
  });

  test('Returned promise resolves to value from handler (microtask executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done');
      });
    });
    const returnedPromise = promise.then((value) => `value is ${value}`);

    returnedPromise.then((value) => {
      expect(value).toBe('value is done');
      done();
    });
  });

  test('Chained promise resolves to prev handler value (sync executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      resolve('done');
    });

    promise
      .then((value) => `value 1 is ${value}`)
      .then((value) => `value 2 is ${value}`)
      .then((value) => {
        expect(value).toBe('value 2 is value 1 is done');
        done();
      });
  });

  test('Chained promise resolves to prev handler value (async executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done');
      }, 0);
    });

    promise
      .then((value) => `value 1 is ${value}`)
      .then((value) => `value 2 is ${value}`)
      .then((value) => {
        expect(value).toBe('value 2 is value 1 is done');
        done();
      });
  });

  test('Chained promise resolves to prev handler value (microtask executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done');
      });
    });

    promise
      .then((value) => `value 1 is ${value}`)
      .then((value) => `value 2 is ${value}`)
      .then((value) => {
        expect(value).toBe('value 2 is value 1 is done');
        done();
      });
  });

  test('Chained promise resolves to prev handler promise value (sync executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      resolve('done1');
    });

    promise.then((value) => new FakePromise((resolve) => {
      resolve(`${value} done2`);
    })).then((value) => new FakePromise((resolve) => {
      resolve(`${value} done3`);
    })).then((value) => {
      expect(value).toBe('done1 done2 done3');
      done();
    });
  });

  test('Chained promise resolves to prev handler promise value (async executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done1');
      }, 0);
    });

    promise.then((value) => new FakePromise((resolve) => {
      setTimeout(() => {
        resolve(`${value} done2`);
      }, 0);
    })).then((value) => new FakePromise((resolve) => {
      setTimeout(() => {
        resolve(`${value} done3`);
      }, 0);
    })).then((value) => {
      expect(value).toBe('done1 done2 done3');
      done();
    });
  });

  test('Chained promise resolves to prev handler promise value (microtask executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done1');
      });
    });

    promise.then((value) => new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve(`${value} done2`);
      });
    })).then((value) => new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve(`${value} done3`);
      });
    })).then((value) => {
      expect(value).toBe('done1 done2 done3');
      done();
    });
  });

  test('Handler returns pending promise that will be resolved (async executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done');
      }, 0);
    });

    promise
      .then((value) => new FakePromise((resolve) => {
        setTimeout(() => {
          resolve(`value1 is ${value}`);
        }, 0);
      }))
      .then((value) => {
        expect(value).toBe('value1 is done');
        done();
      });
  });

  test('Handler returns pending promise that will be resolved (microtask executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done');
      });
    });

    promise
      .then((value) => new FakePromise((resolve) => {
        process.nextTick(() => {
          resolve(`value1 is ${value}`);
        });
      }))
      .then((value) => {
        expect(value).toBe('value1 is done');
        done();
      });
  });

  test('Handler returns pending promise that will be rejected (async executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done');
      }, 0);
    });

    promise
      .then((value) => new FakePromise((resolve, reject) => {
        setTimeout(() => {
          reject(`value1 is ${value}`);
        }, 0);
      }))
      .catch((value) => {
        expect(value).toBe('value1 is done');
        done();
      });
  });

  test('Handler returns pending promise that will be rejected (microtask executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done');
      });
    });

    promise
      .then((value) => new FakePromise((resolve, reject) => {
        process.nextTick(() => {
          reject(`value1 is ${value}`);
        });
      }))
      .catch((value) => {
        expect(value).toBe('value1 is done');
        done();
      });
  });

  test('Handler returns resolved promise (sync executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      resolve('done');
    });

    promise
      .then((value) => new FakePromise((resolve) => {
        resolve(`value1 is ${value}`);
      }))
      .then((value) => {
        expect(value).toBe('value1 is done');
        done();
      });
  });

  test('Handler returns rejected promise (sync executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      resolve('done');
    });

    promise
      .then((value) => new FakePromise((resolve, reject) => {
        reject(`value1 is ${value}`);
      }))
      .catch((value) => {
        expect(value).toBe('value1 is done');
        done();
      });
  });

  test('Resolve promise with then called multiple times (sync executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      resolve('done');
    });

    expect.assertions(2);
    promise.then((value) => {
      expect(value).toBe('done');
    });
    promise.then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Resolve promise with then called multiple times (async executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done');
      }, 0);
    });

    expect.assertions(2);
    promise.then((value) => {
      expect(value).toBe('done');
    });
    promise.then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Resolve promise with then called multiple times (async executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done');
      });
    });

    expect.assertions(2);
    promise.then((value) => {
      expect(value).toBe('done');
    });
    promise.then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Rejected promise jumps to catch (sync executor)', (done) => {
    const promise = new FakePromise((resolve, reject) => {
      reject('error');
    });

    expect.assertions(1);
    promise.then((value) => {
      expect(value).toBeUndefined();
    }).then((value) => {
      expect(value).toBeUndefined();
    }).catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Rejected promise jumps to catch (async executor)', (done) => {
    const promise = new FakePromise((resolve, reject) => {
      setTimeout(() => {
        reject('error');
      }, 0);
    });

    expect.assertions(1);
    promise.then((value) => {
      expect(value).toBeUndefined();
    }).then((value) => {
      expect(value).toBeUndefined();
    }).catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Rejected promise jumps to catch (microtask executor)', (done) => {
    const promise = new FakePromise((resolve, reject) => {
      process.nextTick(() => {
        reject('error');
      });
    });

    expect.assertions(1);
    promise.then((value) => {
      expect(value).toBeUndefined();
    }).then((value) => {
      expect(value).toBeUndefined();
    }).catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Rejected promise in middle of chain jumps to catch (sync executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      resolve('done');
    });

    expect.assertions(2);
    promise.then((value) => {
      expect(value).toBe('done');
      return new FakePromise((resolve, reject) => {
        reject('error');
      });
    }).then((value) => {
      expect(value).toBeUndefined();
    }).catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Rejected promise in middle of chain jumps to catch (async executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done');
      }, 0);
    });

    expect.assertions(2);
    promise.then((value) => {
      expect(value).toBe('done');
      return new FakePromise((resolve, reject) => {
        setTimeout(() => {
          reject('error');
        }, 0);
      });
    }).then((value) => {
      expect(value).toBeUndefined();
    }).catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Rejected promise in middle of chain jumps to catch (microtask executors)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done');
      });
    });

    expect.assertions(2);
    promise.then((value) => {
      expect(value).toBe('done');
      return new FakePromise((resolve, reject) => {
        process.nextTick(() => {
          reject('error');
        });
      });
    }).then((value) => {
      expect(value).toBeUndefined();
    }).catch((reason) => {
      expect(reason).toBe('error');
      done();
    });
  });

  test('Resolved promise propagates value if no handler defined (sync executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      resolve('done');
    });

    promise.then().then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Resolved promise propagates value if no handler defined (async executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      setTimeout(() => {
        resolve('done');
      }, 0);
    });

    promise.then().then((value) => {
      expect(value).toBe('done');
      done();
    });
  });

  test('Resolved promise propagates value if no handler defined (microtask executor)', (done) => {
    const promise = new FakePromise((resolve) => {
      process.nextTick(() => {
        resolve('done');
      });
    });

    promise.then().then((value) => {
      expect(value).toBe('done');
      done();
    });
  });
});
