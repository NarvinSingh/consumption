const curry = (fn, ...params) => (...rest) => fn(...params, ...rest);
const mix = (...mixins) => mixins.reduceRight((Class, createMixin) => createMixin(Class), Object);
const promisify = (fn, context = null) => (...rest) => new Promise((resolve, reject) => {
  fn.call(context, ...rest, (err, value) => {
    if (err) reject(err);
    else resolve(value);
  });
});

export { curry, mix, promisify };
