class FakePromise {
  constructor(executor) {
    this.private = {
      state: 'pending',
      resolve: (value) => {
        if (this.private.state === 'pending') {
          this.private.state = 'resolvedUnsent';
          this.private.value = value;
        }

        if (this.private.state === 'resolvedUnsent' && this.private.handleResolve) {
          this.private.state = 'resolvedSent';
          queueMicrotask(() => {
            try {
              const result = this.private.handleResolve(this.private.value);

              if (!this.private.nextPromise) {
                this.private.nextPromise = new FakePromise((resolve) => resolve(result));
              }
            } catch (err) {
              this.private.nextPromise = new FakePromise((resolve, reject) => reject(err));
            }
          });
        }
      },
      reject: (reason) => {
        if (this.private.state === 'pending') {
          this.private.state = 'rejectedUnsent';
          this.private.reason = reason;
        }

        if (this.private.state === 'rejectedUnsent' && this.private.handleReject) {
          this.private.state = 'rejectedSent';
          queueMicrotask(() => {
            try {
              const result = this.private.handleReject(this.private.reason);

              this.private.nextPromise = new FakePromise((resolve) => resolve(result));
            } catch (err) {
              this.private.nextPromise = new FakePromise((resolve, reject) => reject(err));
            }
          });
        }
      },
    };

    executor(this.private.resolve, this.private.reject);
  }

  // Does not implement calling then more than once on the same promise. Only a handler from the
  // last then call before the promise is resolved or rejected will be called.
  then(resolve, reject) {
    this.private.handleResolve = resolve;
    this.private.handleReject = reject;
    this.private.resolve();
    this.private.reject();

    this.private.nextPromise = this.private.nextPromise
      || new FakePromise((nextResolve, nextReject) => {
        nextResolve(this.private.result);
      });

    return this.private.nextPromise;
  }

  catch(reject) {
    return this.then(null, reject);
  }
}

// const realPromise1 = new Promise((resolve) => {
//   setTimeout(() => {
//     console.log('realPromise1 setTimeout callback ran a');
//     resolve('Success!');
//     resolve('Success again!');
//     console.log('realPromise1 setTimeout callback ran b');
//   }, 0);
// });

// realPromise1.then((successMessage) => {
//   console.log(`realPromise1 Yay! ${successMessage}`);
// });

// const realPromise2 = new Promise((resolve) => {
//   setTimeout(() => {
//     console.log('realPromise2 setTimeout callback ran a');
//     resolve('Success!');
//     resolve('Success again!');
//     console.log('realPromise2 setTimeout callback ran b');
//   }, 0);
// });

// realPromise2.then((successMessage) => {
//   console.log(`realPromise2 Yay! ${successMessage}`);
// });

// const fakePromise1 = new FakePromise((resolve) => {
//   setTimeout(() => {
//     console.log('fakePromise1 setTimeout callback ran a');
//     resolve('Success!');
//     resolve('Success again!');
//     console.log('fakePromise1 setTimeout callback ran b');
//   }, 0);
// });

// fakePromise1.then((successMessage) => {
//   console.log(`fakePromise1 Yay! ${successMessage}`);
// });

// const fakePromise2 = new FakePromise((resolve) => {
//   setTimeout(() => {
//     console.log('fakePromise2 setTimeout callback ran a');
//     resolve('Success!');
//     resolve('Success again!');
//     console.log('fakePromise2 setTimeout callback ran b');
//   }, 0);
// });

// setImmediate(() => fakePromise2.then((successMessage) => {
//   console.log(`fakePromise2 Yay! ${successMessage}`);
// }));

const promise = new Promise((resolve) => {
  console.time('for loop duration');
  console.log('for loop started');
  for (let i = 0; i < 1000000000; i += 1);
  console.log('for loop ended');
  console.timeEnd('for loop duration');
  resolve();
});

console.log('promise created');

promise.then(() => console.log('promise resolved'));
