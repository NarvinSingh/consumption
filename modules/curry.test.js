import { curry } from './utils.mjs';

describe('Curry tests', () => {
  const square = (x) => x * x;
  const add = (a, b) => a + b;
  const sum = (...ns) => ns.flat().reduce((acc, cur) => acc + cur);

  test('Test functions work', () => {
    expect(square(4)).toBe(16);
    expect(add(2, 3)).toBe(5);
    expect(sum(1)).toBe(1);
    expect(sum(1, 2, 3)).toBe(6);
    expect(sum([1, 2, 3])).toBe(6);
  });

  test('Curries a function that has one parameter', () => {
    const square4 = curry(square, 4);

    expect(square4()).toBe(16);
  });

  test('Curries a function that has two parameters', () => {
    const add2 = curry(add, 2);

    expect(add2(3)).toBe(5);
  });

  test('Curries a function that has unlimited parameters', () => {
    const sum1 = curry(sum, 1);

    expect(sum1(2, 3)).toBe(6);
  });

  test('Curries a function twice that has unlimited parameters', () => {
    const sum1and2 = curry(curry(sum, 1), 2);

    expect(sum1and2(3)).toBe(6);
  });

  test('Curries two arguments to a function that has unlimited parameters', () => {
    const sum1and2 = curry(sum, 1, 2);

    expect(sum1and2(3)).toBe(6);
  });
});
