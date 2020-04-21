export default function Promisify(fn) {
  return function fnPromise(...rest) {
    return new Promise((resolve, reject) => {
      fn(...rest, (err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });
  };
}
