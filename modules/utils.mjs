function coalesce(...args) {
  return args.find((arg) => typeof arg !== 'undefined');
}

function curry(fn, ...params) {
  return function curriedFn(...rest) {
    return fn.call(this, ...params, ...rest);
  };
}

function mix(Base, ...mixins) {
  return mixins.reduce((Class, createMixin) => createMixin(Class), Base);
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

export { coalesce, curry, mix, promisify };
