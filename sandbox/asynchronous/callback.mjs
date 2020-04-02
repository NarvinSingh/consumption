function takeAwhile(input, resolve, reject) {
  setTimeout(() => {
    if (input % 2 === 0) {
      const value = { isEven: true, input };

      resolve(value);
    } else {
      const reason = 'The parameter is not even';

      reject(reason);
    }
  }, 1000);
}

export default takeAwhile;
