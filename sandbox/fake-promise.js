class FakePromise {
  constructor(executor) {
    this._ = {
      state: 'pending',

      settleThisAndNextPromise: (handle) => {
        if (handle) {
          queueMicrotask(() => {
            try {
              this._.nextPromise._.resolve(handle(this._.value));
            } catch (err) {
              this._.nextPromise._.reject(err);
            }
          });
        }
      },

      resolve: (value) => {
        if (this._.state === 'pending') {
          this._.state = 'fulfilled';
          this._.value = value;

          // Promise was fulfilled after then was called so fulfill promise returned by then with
          // this promise's handleFulfilled callback return value
          this._.settleThisAndNextPromise(this._.handleFulfilled);
        }
      },

      reject: (reason) => {
        if (this._.state === 'pending') {
          this._.state = 'rejected';
          this._.reason = reason;

          // Promise was rejected after then was called so fulfill promise returned by then with
          // this promise's handleRejected callback return value
          this._.settleThisAndNextPromise(this._.handleRejected);
        }
      },
    };

    executor(this._.resolve, this._.reject);
  }

  // Does not implement calling then more than once on the same promise. Only a handler from the
  // last then call before the promise is fulfilled or rejected will be called.
  then(handleFulfilled, handleRejected) {
    this._.handleFulfilled = handleFulfilled;
    this._.handleRejected = handleRejected;
    this._.nextPromise = new FakePromise(() => {
      // The executor doesn't do anthing so this next promise will remain pending indefinitely
      // When this promise is settled, it will manually settle the next promise
    });

    // Promise was fulfilled before then was called so fulfill promise returned by then with this
    // promise's handleFulfilled callback return value
    if (this._.state === 'fulfilled') {
      this._.settleThisAndNextPromise(this._.handleFulfilled);

    // Promise was rejected before then was called so fulfill promise returned by then with this
    // promise's handleRejected callback return value
    } else if (this._.state === 'rejected') {
      this._.settleThisAndNextPromise(this._.handleRejected);
    }

    return this._.nextPromise;
  }

  catch(reject) {
    return this.then(null, reject);
  }
}

const messages = [];

const realPromise1 = new Promise((resolve) => {
  setTimeout(() => {
    messages.push('realPromise1 setTimeout callback ran a');
    resolve('realPromise1 resolve ran by executor');
    resolve('realPromise1 resolve not ran by executor a second time (message not pushed)');
    messages.push('realPromise1 setTimeout callback ran b');
  }, 0);
});

realPromise1.then((value) => {
  messages.push(value);
});

const realPromise2 = new Promise((resolve) => {
  setTimeout(() => {
    messages.push('realPromise2 setTimeout callback ran a');
    resolve('realPromise2 resolve ran by executor');
    resolve('realPromise2 resolve not ran by executor a second time (message not pushed)');
    messages.push('realPromise2 setTimeout callback ran b');
  }, 0);
});

setImmediate(() => realPromise2.then((value) => {
  messages.push(value);
}));

const fakePromise1 = new FakePromise((resolve) => {
  setTimeout(() => {
    messages.push('fakePromise1 setTimeout callback ran a');
    resolve('fakePromise1 resolve ran by executor');
    resolve('fakePromise1 resolve not ran by executor a second time (message not pushed)');
    messages.push('fakePromise1 setTimeout callback ran b');
  }, 0);
});

fakePromise1.then((value) => {
  messages.push(value);
});

const fakePromise2 = new FakePromise((resolve) => {
  setTimeout(() => {
    messages.push('fakePromise2 setTimeout callback ran a');
    resolve('fakePromise2 resolve ran by executor');
    resolve('fakePromise2 resolve not ran by executor a second time (message not pushed)');
    messages.push('fakePromise2 setTimeout callback ran b');
  }, 0);
});

setImmediate(() => fakePromise2.then((value) => {
  messages.push(value);
}));

setImmediate(() => console.log(messages));

console.time('real/fakePromise3 duration');

const realPromise3 = new Promise((resolve) => {
  console.time('realPromise3 for loop duration');
  console.log('realPromise3 for loop started');
  for (let i = 0; i < 1000000000; i += 1);
  console.log('realPromise3 for loop ended');
  console.timeEnd('realPromise3 for loop duration');
  resolve();
});

console.log('realPromise3 promise created');

realPromise3.then(() => console.log('realPromise3 promise resolved'));

const fakePromise3 = new FakePromise((resolve) => {
  console.time('fakePromise3 for loop duration');
  console.log('fakePromise3 for loop started');
  for (let i = 0; i < 1000000000; i += 1);
  console.log('fakePromise3 for loop ended');
  console.timeEnd('fakePromise3 for loop duration');
  resolve();
});

console.log('fakePromise3 promise created');

fakePromise3.then(() => console.log('fakePromise3 promise resolved'));
console.timeEnd('real/fakePromise3 duration');
