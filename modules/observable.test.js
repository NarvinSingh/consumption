import createObservable from './observable.mjs';

const Observable = createObservable();
const observers = [...Array(5)].map(() => jest.fn((data) => data));

describe('Observable addObservers tests', () => {
  test.each([
    ['a single observer', [observers[0]], observers[0]],
    ['a single observer passed as an array', [observers[0]], [observers[0]]],
    [
      'multiple observers',
      [observers[0], observers[1], observers[2], observers[3], observers[4]],
      observers[0], observers[1], observers[2], observers[3], observers[4],
    ],
    ['multiple observers passed as an array', observers, observers],
    [
      'multiple observers with duplicates',
      [observers[0], observers[1]],
      observers[0], observers[1], observers[1], observers[0],
    ],
    [
      'multiple observers with duplicates passed as an array',
      [observers[0], observers[1]],
      [observers[0], observers[1], observers[1], observers[0]],
    ],
  ])('Add %s', (what, expectedobservers, ...providedobservers) => {
    const observable = new Observable();

    observable.addObservers(...providedobservers);
    expect([...observable.observers]).toStrictEqual(expectedobservers);
  });
});

describe('Observable removeObservers tests', () => {
  test.each([
    ['a single observer', [observers[0], observers[1], observers[3], observers[4]], observers[2]],
    [
      'a single observer passed as an array',
      [observers[0], observers[1], observers[3], observers[4]],
      [observers[2]],
    ],
    [
      'multiple observers',
      [],
      observers[0], observers[1], observers[2], observers[3], observers[4],
    ],
    ['multiple observers passed as an array', [], observers],
    [
      'multiple observers with duplicates',
      [observers[2], observers[3], observers[4]],
      observers[0], observers[1], observers[1], observers[0],
    ],
    [
      'multiple observers with duplicates passed as an array',
      [observers[2], observers[3], observers[4]],
      [observers[0], observers[1], observers[1], observers[0]],
    ],
  ])('Remove %s', (what, expectedobservers, ...providedobservers) => {
    const observable = new Observable();

    observable.addObservers(observers);
    observable.removeObservers(...providedobservers);
    expect([...observable.observers]).toStrictEqual(expectedobservers);
  });
});

describe('Observable notifyObservers tests', () => {
  test('Notify all observers with data', () => {
    const observable = new Observable();
    const data = { event: 'test', detail: 1 };

    observable.addObservers(observers);
    observable.notifyObservers(data);
    observers.forEach((observer) => {
      expect(observer).toHaveBeenCalledTimes(1);
      expect(observer).toHaveBeenCalledWith(data);
    });
  });
});
