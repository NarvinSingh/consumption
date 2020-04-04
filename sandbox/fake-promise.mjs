let nextId = 0;

export default class FakePromise {
  constructor(executor) {
    this._ = {
      id: nextId,
      state: 'pending',

      trySettleThisAndNextPromise: () => {
        // The promise is fulfilled or rejected and has a value, so settle it by calling the handler
        // If the handler is not set then it means either:
        //  1) The promise was resolved or rejected before then was called, so it will be settled
        //     when then is called
        //  2) then was called before the promise was resolved or rejected, so it will be settled
        //     when it is resolved or rejected
        const handle = this._[this._.handlerName];
        if (handle) {
          console.log('Will settle async', this._);
          queueMicrotask(() => {
            try {
              this._.nextPromise._.resolve(handle(this._.value));
              console.log(`called ${this._.handlerName} and resolved nextPromise`, this._);
            } catch (err) {
              this._.nextPromise._.reject(err);
              console.log(`${this._.handlerName} threw and rejected nextPromise`, this._);
            }
          });
        } else {
          console.log('Will not settle', this._);
        }
      },

      resolve: (value) => {
        if (this._.state === 'pending') {
          this._.state = 'fulfilled';
          this._.handlerName = 'handleFulfilled';
          this._.value = value;
          console.log('resolve will try to settle', this._);
          this._.trySettleThisAndNextPromise();
        }
      },

      reject: (reason) => {
        if (this._.state === 'pending') {
          this._.state = 'rejected';
          this._.handlerName = 'handleRejected';
          this._.value = reason;
          console.log('reject will try to settle', this._);
          this._.trySettleThisAndNextPromise();
        }
      },
    };

    nextId += 1;
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
    console.log('then will try to settle', this._);
    this._.trySettleThisAndNextPromise();

    console.log('then will return nextPromise', this._);
    return this._.nextPromise;
  }

  catch(handleRejected) {
    return this.then(null, handleRejected);
  }
}
