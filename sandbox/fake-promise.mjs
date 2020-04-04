let nextId = 0;

export default class FakePromise {
  constructor(executor) {
    this._ = {
      id: nextId,
      state: 'pending',
      fulfilledHandlers: [],
      rejectedHandlers: [],
      thenPromises: [],

      // Cause the then promise to be resolved with the same value as this promise so that value can
      // propagate to a defined resolved handler
      handleFulfilledDefault: () => this._.value,

      handleRejectedDefault: () => {
        // Cause the then promise to be rejected with the same reason as this promise so that reason
        // can propagate to a defined rejected handler
        throw this._.value;
      },

      trySettleThisAndThenPromise: () => {
        // The promise is fulfilled or rejected and has a value, so settle it by calling the handler
        // and resolving or rejecting the then promise with the handler's return value
        // If the handler is not set then it means either:
        //  1) The promise was resolved or rejected before then was called, so it will be settled
        //     when then is called
        //  2) then was called before the promise was resolved or rejected, so it will be settled
        //     when it is resolved or rejected
        if (this._.activeHandlers) {
          while (this._.activeHandlers.length) {
            const handle = this._.activeHandlers.shift();
            const thenPromise = this._.thenPromises.shift();

            queueMicrotask(() => {
              try {
                const result = handle(this._.value);

                // If the handler returns a promise, resolve or reject the then promise with the
                // value of the handler's promise instead of the hanlder's promise itself
                if (result instanceof FakePromise) {
                  // If the handler's promise is still pending, link the then promise to it so that
                  // the then promise can get the handler's promise's state and value once the
                  // handler's promise is resolved or rejected
                  if (result._.state === 'pending') {
                    result._.linkedPromise = thenPromise;
                  } else if (result._.state === 'fulfilled') {
                    thenPromise._.resolve(result._.value);
                  } else {
                    thenPromise._.reject(result._.value);
                  }
                } else {
                  thenPromise._.resolve(result);
                }
              } catch (err) {
                thenPromise._.reject(err);
              }
            });
          }
        }
      },

      resolve: (value) => {
        if (this._.state === 'pending') {
          this._.state = 'fulfilled';
          this._.activeHandlers = this._.fulfilledHandlers;
          this._.value = value;
          this._.trySettleThisAndThenPromise();

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
          this._.trySettleThisAndThenPromise();

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

  then(
    handleFulfilled = this._.handleFulfilledDefault,
    handleRejected = this._.handleRejectedDefault,
  ) {
    const thenPromise = new FakePromise(() => {
      // The executor doesn't do anthing so the then promise will remain pending until one of the
      // handlers of this promise return a value, with which the then promise will be manually
      // resolved or rejected
    });

    this._.thenPromises.push(thenPromise);
    this._.fulfilledHandlers.push(handleFulfilled);
    this._.rejectedHandlers.push(handleRejected);
    this._.trySettleThisAndThenPromise();

    return thenPromise;
  }

  catch(handleRejected) {
    return this.then(null, handleRejected);
  }
}
