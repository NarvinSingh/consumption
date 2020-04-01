function takeAwhile(input, resolve, reject) {
  setTimeout(() => {
    if (input % 2 === 0) {
      const result = { isEven: true, input };

      resolve(result);
    } else {
      const result = { isEven: false, input };

      reject(result);
    }
  }, 1000);
}

export default takeAwhile;
