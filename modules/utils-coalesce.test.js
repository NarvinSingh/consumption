import { coalesce, coalesceLast } from './utils.mjs';

describe('coalesce tests', () => {
  test('First arg is undefined', () => {
    let a;
    expect(coalesce(a, 1)).toBe(1);
  });

  test('First arg is defined', () => {
    const a = 2;
    expect(coalesce(a, 1)).toBe(2);
  });

  test('Middle arg is the first defined arg', () => {
    let a;
    const b = 2;
    expect(coalesce(a, b, 1)).toBe(2);
  });

  test('Only the last arg is defined', () => {
    let a;
    let b;
    expect(coalesce(a, b, 1)).toBe(1);
  });

  test('No args are defined', () => {
    let a;
    let b;
    let c;
    expect(coalesce(a, b, c)).toBeUndefined();
  });
});

describe('coalesceLast tests', () => {
  test('Last arg is undefined', () => {
    let a;
    expect(coalesceLast(1, a)).toBe(1);
  });

  test('Last arg is defined', () => {
    const a = 2;
    expect(coalesceLast(1, a)).toBe(2);
  });

  test('Middle arg is the first defined arg', () => {
    let a;
    const b = 2;
    expect(coalesceLast(1, b, a)).toBe(2);
  });

  test('Only the first arg is defined', () => {
    let a;
    let b;
    expect(coalesceLast(1, b, a)).toBe(1);
  });

  test('No args are defined', () => {
    let a;
    let b;
    let c;
    expect(coalesceLast(a, b, c)).toBeUndefined();
  });
});
