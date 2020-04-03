class FakePromise {
  constructor(executor) {
    this._ = {
      state: 'pending',

      resolve: (value) => {
        if (this._.state === 'pending') {
          this._.state = 'fulfilled';
          this._.value = value;

          // Promise was fulfilled after then was called so fulfill promise returned by then with
          // this promise's handleFulfilled callback return value
          if (this._.handleFulfilled) {
            queueMicrotask(() => {
              try {
                this._.nextPromise._.resolve(this._.handleFulfilled(this._.value));
              } catch (err) {
                this._.nextPromise._.reject(err);
              }
            });
          }
        }
      },

      reject: (reason) => {
        if (this._.state === 'pending') {
          this._.state = 'rejected';
          this._.reason = reason;

          // Promise was rejected after then was called so fulfill promise returned by then with
          // this promise's handleRejected callback return value
          if (this._.handleRejected) {
            queueMicrotask(() => {
              try {
                this._.nextPromise._.resolve(this._.handleRejected(this._.value));
              } catch (err) {
                this._.nextPromise._.reject(err);
              }
            });
          }
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

    if (this._.state === 'pending') {
      this._.nextPromise = new FakePromise(() => {
        // The executor doesn't do anthing so this next promise will remain pending indefinitely
        // When this promise is fulfilled, it will manually fulfill the next promise
      });

      return this._.nextPromise;
    }

    // Promise was fulfilled before then was called so fulfill promise returned by then with this
    // promise's handleFulfilled callback return value
    if (this._.state === 'fulfilled') {
      queueMicrotask(() => {
        try {
          return new FakePromise((resolve) => resolve(this._.handleFulfilled(this._.value)));
        } catch (err) {
          return new FakePromise((resolve, reject) => reject(err));
        }
      });
    }

    // Promise was rejected before then was called so fulfill promise returned by then with this
    // promise's handleRejected callback return value
    queueMicrotask(() => {
      try {
        return new FakePromise((resolve) => resolve(this._.handleRejected(this._.value)));
      } catch (err) {
        return new FakePromise((resolve, reject) => reject(err));
      }
    });
  }

  catch(reject) {
    return this.then(null, reject);
  }
}

const realPromise1 = new Promise((resolve) => {
  setTimeout(() => {
    console.log('realPromise1 setTimeout callback ran a');
    resolve('Success!');
    resolve('Success again!');
    console.log('realPromise1 setTimeout callback ran b');
  }, 0);
});

realPromise1.then((successMessage) => {
  console.log(`realPromise1 Yay! ${successMessage}`);
});

const realPromise2 = new Promise((resolve) => {
  setTimeout(() => {
    console.log('realPromise2 setTimeout callback ran a');
    resolve('Success!');
    resolve('Success again!');
    console.log('realPromise2 setTimeout callback ran b');
  }, 0);
});

realPromise2.then((successMessage) => {
  console.log(`realPromise2 Yay! ${successMessage}`);
});

const fakePromise1 = new FakePromise((resolve) => {
  setTimeout(() => {
    console.log('fakePromise1 setTimeout callback ran a');
    resolve('Success!');
    resolve('Success again!');
    console.log('fakePromise1 setTimeout callback ran b');
  }, 0);
});

fakePromise1.then((successMessage) => {
  console.log(`fakePromise1 Yay! ${successMessage}`);
});

const fakePromise2 = new FakePromise((resolve) => {
  setTimeout(() => {
    console.log('fakePromise2 setTimeout callback ran a');
    resolve('Success!');
    resolve('Success again!');
    console.log('fakePromise2 setTimeout callback ran b');
  }, 0);
});

setImmediate(() => fakePromise2.then((successMessage) => {
  console.log(`fakePromise2 Yay! ${successMessage}`);
}));

// const promise = new Promise((resolve) => {
//   console.time('for loop duration');
//   console.log('for loop started');
//   for (let i = 0; i < 1000000000; i += 1);
//   console.log('for loop ended');
//   console.timeEnd('for loop duration');
//   resolve();
// });

// console.log('promise created');

// promise.then(() => console.log('promise resolved'));
