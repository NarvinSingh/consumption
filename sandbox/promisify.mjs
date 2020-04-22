export default function promisify(fn, context = null) {
  return function fnPromise(...rest) {
    return new Promise((resolve, reject) => {
      fn.call(context, ...rest, (err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });
  };
}
