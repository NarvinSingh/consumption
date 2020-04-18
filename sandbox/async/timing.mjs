/* eslint-disable no-console */

function foo() {
  return new Promise((resolve) => {
    let i;
    for (i = 0; i < 1000000000; i += 1);
    console.log('i1', i);
    resolve(i);
  });
}

async function asyncFoo() {
  let i;
  for (i = 0; i < 1000000000; i += 1);
  console.log('i2', i);
  return i;
}

// The promise executor runs immediately, synchronously and will block
console.time('entry 1');
console.timeLog('entry 1');
const result = foo();
console.log('result', result);
console.timeEnd('entry 1');
console.log();

// The function runs immediately, synchronously and will block
console.time('entry 2');
console.timeLog('entry 2');
const result2 = asyncFoo();
console.log('result', result2);
console.timeEnd('entry 2');
console.log();

// The function runs immediately, synchronously and will block
(async () => {
  console.time('entry 3');
  console.timeLog('entry 3');
  const result3 = await asyncFoo();
  console.log('result', result3);
  console.timeEnd('entry 3');
  console.log();
})();
