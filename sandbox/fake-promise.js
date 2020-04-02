class FakePromise {
  constructor(executor) {
    this.privResolve = function privResolve(value) {
      if (this.isResolved) {
        return;
      }

      this.privValue = value;
      this.isResolved = true;

      if (this.resolve) {
        console.log('fakePromise resolved in constructor');
        queueMicrotask(() => this.resolve(value));
      }
    };

    this.privReject = function privReject(reason) {
      if (this.isRejected) {
        return;
      }

      this.privReason = reason;
      this.isRejected = true;

      if (this.reject) {
        console.log('fakePromise rejected in constructor');
        queueMicrotask(() => this.reject(reason));
      }
    };

    executor(this.privResolve.bind(this), this.privReject.bind(this));
  }

  then(resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;

    if (this.isResolved) {
      console.log('fakePromise resolved in then');
      resolve(this.privValue);
      return null;
    }

    if (this.isRejected) {
      console.log('fakePromise rejected in then');
      reject(this.privReason);
      return null;
    }

    return null;
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
