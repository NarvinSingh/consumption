function takeAwhile(input) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (input % 2 === 0) {
        resolve({ isEven: true, input });
      } else {
        reject(new Error(`The parameter is not even: ${input}`));
      }
    }, 0);
  });
}

export default takeAwhile;
