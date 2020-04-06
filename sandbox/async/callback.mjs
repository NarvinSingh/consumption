function takeAwhile(input, handleFulfilled, handleRejected) {
  setTimeout(() => {
    if (input % 2 === 0) {
      handleFulfilled({ isEven: true, input });
    } else {
      handleRejected(new Error('The parameter is not even'));
    }
  }, 0);
}

export default takeAwhile;
