async function asyncFunction() {
  console.log('asyncFunction', 1);
  const value1 = await Promise.resolve(2);
  console.log('asyncFunction', value1);
  console.log('asyncFunction', 3);
  console.log('asyncFunction', await Promise.resolve(4));
  console.log('asyncFunction', 5);
}

function thenFunction() {
  console.log('thenFunction', 1);
  let value1;
  Promise.resolve(2).then((value) => {
    value1 = value;
    console.log('thenFunction', value1);
    console.log('thenFunction', 3);
  }).then(
    () => Promise.resolve(4),
  ).then((value) => {
    console.log('thenFunction', value);
    console.log('thenFunction', 5);
  });
}

asyncFunction();
console.log('a');
thenFunction();
console.log('b');
