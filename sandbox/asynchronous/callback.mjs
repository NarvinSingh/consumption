function takeAwhile(input, callback) {
  setTimeout(() => {
    const res = { done: true, input };
    callback(res);
  }, 1000);
}

export default takeAwhile;
