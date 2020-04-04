let nextId = 0;

export default class FakePromise {
  constructor(executor) {
    this._ = {
      id: nextId,
      state: 'pending',
      fulfilledHandlers: [],
      rejectedHandlers: [],
      nextPromises: [],

      trySettleThisAndNextPromise: () => {
        // The promise is fulfilled or rejected and has a value, so settle it by calling the handler
        // and resolving or rejecting the next promise with the handler's return value
        // If the handler is not set then it means either:
        //  1) The promise was resolved or rejected before then was called, so it will be settled
        //     when then is called
        //  2) then was called before the promise was resolved or rejected, so it will be settled
        //     when it is resolved or rejected
        if (this._.activeHandlers) {
          // console.log('Will settle async', this._);
          while (this._.activeHandlers.length) {
            const handle = this._.activeHandlers.shift();
            const nextPromise = this._.nextPromises.shift();

            if (handle) {
              queueMicrotask(() => {
                try {
                  const result = handle(this._.value);

                  // If the handler returns a promise, resolve or reject the next promise with the
                  // value of the returned promise instead of the returned promise itself
                  if (result instanceof FakePromise) {
                    // If the returned promise is still pending, link the next promise to it so that
                    // the next promise can get the returned promise's state and value once the
                    // returned promise is resolved or rejected
                    if (result._.state === 'pending') {
                      result._.linkedPromise = nextPromise;
                    } else if (result._.state === 'fulfilled') {
                      nextPromise._.resolve(result._.value);
                    } else {
                      nextPromise._.reject(result._.value);
                    }
                  } else {
                    nextPromise._.resolve(result);
                  }
                  // console.log(`called ${this._.handlerName} and resolved nextPromise`, this._);
                } catch (err) {
                  nextPromise._.reject(err);
                  // console.log(`${this._.handlerName} threw and rejected nextPromise`, this._);
                }
              });
            }
          }
        } else {
          // console.log('Will not settle', this._);
        }
      },

      resolve: (value) => {
        if (this._.state === 'pending') {
          this._.state = 'fulfilled';
          this._.activeHandlers = this._.fulfilledHandlers;
          this._.value = value;
          // console.log('resolve will try to settle', this._);
          this._.trySettleThisAndNextPromise();

          // This promise was returned from a then handler so resolve the promise it is linked to as
          // well with this promise's value
          if (this._.linkedPromise) {
            this._.linkedPromise._.resolve(value);
          }
        }
      },

      reject: (reason) => {
        if (this._.state === 'pending') {
          this._.state = 'rejected';
          this._.activeHandlers = this._.rejectedHandlers;
          this._.value = reason;
          // console.log('reject will try to settle', this._);
          this._.trySettleThisAndNextPromise();

          // This promise was returned from a then handler so reject the promise it is linked to as
          // well with this promise's value
          if (this._.linkedPromise) {
            this._.linkedPromise._.reject(reason);
          }
        }
      },
    };

    nextId += 1;
    executor(this._.resolve, this._.reject);
  }

  then(handleFulfilled, handleRejected) {
    const nextPromise = new FakePromise(() => {
      // The executor doesn't do anthing so this next promise will remain pending indefinitely
      // When this promise is settled, it will manually settle the next promise
    });

    this._.nextPromises.push(nextPromise);
    this._.fulfilledHandlers.push(handleFulfilled);
    this._.rejectedHandlers.push(handleRejected);
    // console.log('then will try to settle', this._);
    this._.trySettleThisAndNextPromise();

    // console.log('then will return nextPromise', this._);
    return nextPromise;
  }

  catch(handleRejected) {
    return this.then(null, handleRejected);
  }
}
