/* eslint-disable no-console */

// Only declare a function async when you need to await a promise inside of it. Don't declare a
// function async simply to wrap the return value or thrown error in a promise because that usually
// means the function is synchronous and should just return a non-promise value or throw an error.
// In particular, you shouldn't delare a function async when the function returns the value of
// another function that is already a promise or you are creating multiple promises and selecting
// one to return.

// Declaring a function async wraps the return value in a resolved promise or a thrown error in a
// rejected promise
// Awaiting a function blocks until the function returns, then returns the value of a resolved
// promise or throws the reason of a rejected promise

// Both resolve and resolveAsync behave the same when called
// The only difference is that resolve has to explicity return a promise, whereas declaring the
// function async automatically wraps the return value in a promise

// When called synchronously, returns a resolved promise
// When called asynchronously, returns a resolved promise
// When awaited, returns a resolved value
function resolve(value) {
  return Promise.resolve(value);
}

// When called synchronously, returns a resolved promise
// When called asynchronously, returns a resolved promise
// When awaited, returns a resolved value
async function resolveAsync(value) {
  return value;
}

// Both reject and raiseAsync behave the same when called
// The only difference is that reject has to explicity return a promise, whereas declaring the
// function async automatically wraps the thrown error in a rejected promise

// When called synchronously, returns a rejected promise
// When called asynchronously, returns a rejected promise
// *When awaited, throws a rejected reason (analagous to returning a resolved value)
function reject(reason) {
  return Promise.reject(new Error(reason));
}

// *When called synchronously, returns a rejected promise with the error that was thrown
// *When called asynchronously, returns a rejected promise with the error that was thrown
// When awaited, throws an error
async function raiseAsync(message) {
  throw new Error(message);
}

// *When called synchronously, returns a fulfilled promise (this is a bad pattern)
// *When called asynchronously, returns a fulfilled promise (this is a bad pattern)
// *When awaited, returns a resolved value (this is a bad pattern, should throw instead)
async function rejectAsync(reason) {
  return new Error(reason);
}

// This is just a regular, synchronous function
// When called synchronously, throws an error
// *When called asynchronously, throws an error (runs synchronously)
// *When awaited, throws an error (runs synchronously, no need to await)
function raise(message) {
  throw new Error(message);
}

const messages = [];
let n = 0;

function l(id, ...args) {
  n += 1;
  messages[id - 1] = [id, ...args];
}

function logAll(nExpected) {
  l(n + 1, n === nExpected, `all messages logged (n === ${n})`);
  messages.forEach((message) => { if (message) console.log(...message); });
}

let result = resolve(1);
l(1, result instanceof Promise, 'resolve returns a promise');
result.then((value) => { l(2, value === 1, 'resolve returns a fulfilled promise'); });
result = reject(2);
l(3, result instanceof Promise, 'reject returns a promise');
result.catch((reason) => {
  l(
    4,
    reason instanceof Error && reason.message === '2',
    'reject returns a rejected promise with an Error object',
  );
});
try {
  result = raise(3);
} catch (err) {
  l(5, err instanceof Error && err.message === '3', 'raise throws an Error object');
}

result = resolveAsync(4);
l(6, result instanceof Promise, 'resolveAsync returns a promise');
result.then((value) => {
  l(7, value === 4, 'resolveAsync returns a fulfilled promise');
});
result = rejectAsync(5);
l(8, result instanceof Promise, 'rejectAsync returns a promise');
result.then((reason) => {
  l(
    9,
    reason instanceof Error && reason.message === '5',
    '*rejectAsync returns a *fulfilled* promise with an Error object',
  );
});
try {
  result = raiseAsync(6);
  l(10, true, '*outside an async function raiseAsync *does not throw* synchronously');
  result.catch((reason) => {
    l(
      11,
      reason instanceof Error && reason.message === '6',
      '*outside an async function raiseAsync returns a rejected promise with the Error object that was thrown',
    );
  });
} catch (err) {
  console.log('***NO-OP***');
}

(async () => {
  result = resolve(7);
  l(12, result instanceof Promise, 'inside an async function resolve returns a promise');
  result.then((value) => {
    l(13, value === 7, 'inside an async function resolve returns a fulfilled promise');
  });
  l(14, await result === 7, 'awaiting resolve returns a value');
  result = reject(8);
  l(15, result instanceof Promise, 'inside an async function reject returns a promise');
  result.catch((reason) => {
    l(
      16,
      reason instanceof Error && reason.message === '8',
      'inside an async function reject returns a rejected promise with an Error object',
    );
  });
  try {
    await result;
  } catch (err) {
    l(
      17,
      err instanceof Error && err.message === '8',
      'awaiting reject throws an Error object',
    );
  }
  try {
    result = raise(9);
  } catch (err) {
    l(
      18,
      err instanceof Error && err.message === '9',
      'inside an async function raise throws an Error object',
    );
  }
  try {
    result = await raise(10);
  } catch (err) {
    l(19, err instanceof Error && err.message === '10', 'awaiting raise throws an Error object');
  }
  result = resolveAsync(11);
  l(20, result instanceof Promise, 'inside an async function resolveAsync returns a promise');
  result.then((value) => {
    l(21, value === 11, 'inside an async function resolveAsync returns a fulfilled promise');
  });
  result = rejectAsync(12);
  l(22, result instanceof Promise, 'inside an async function rejectAsync returns a promise');
  result.then((reason) => {
    l(
      23,
      reason instanceof Error && reason.message === '12',
      'inside an async function *rejectAsync returns a *fulfilled* promise with an Error object',
    );
  });
  try {
    result = raiseAsync(13);
    l(24, true, '*inside an async function raiseAsync *does not throw* synchronously');
    result.catch((reason) => {
      l(
        25,
        reason instanceof Error && reason.message === '13',
        '*inside an async function raiseAsync returns a rejected promise with the Error object that was thrown',
      );
    });
  } catch (err) {
    console.log('***NO-OP***');
  }
  result = await resolveAsync(14);
  l(26, result === 14, 'awaiting resolveAsync returns the value of a fulfilled promise');
  result = await rejectAsync(15);
  l(
    27,
    result instanceof Error && result.message === '15',
    'awaiting rejectAsync returns the value of a rejected promise',
  );
  try {
    result = await raiseAsync(16);
  } catch (err) {
    l(
      28,
      err instanceof Error && err.message === '16',
      'awaiting raiseAsync throws an Error object',
    );
  }
  logAll(28);
})();
