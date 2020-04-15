function curry(fn, ...params) {
  return function curriedFn(...rest) {
    return fn(...params, ...rest);
  };
}

export default curry;
