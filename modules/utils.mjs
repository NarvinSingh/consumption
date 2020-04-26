function curry(fn, ...params) {
  return function curriedFn(...rest) {
    return fn.call(this, ...params, ...rest);
  };
}

function mix(...mixins) {
  return mixins.reduceRight((Class, createMixin) => createMixin(Class), Object);
}

function promisify(fn, context = null) {
  return function promiseFn(...rest) {
    return new Promise((resolve, reject) => {
      fn.call(context, ...rest, (err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });
  };
}

export { curry, mix, promisify };
