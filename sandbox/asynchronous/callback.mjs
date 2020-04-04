function takeAwhile(input, resolve, reject) {
  setTimeout(() => {
    if (input % 2 === 0) {
      resolve({ isEven: true, input });
    } else {
      reject(new Error('The parameter is not even'));
    }
  }, 1000);
}

export default takeAwhile;
