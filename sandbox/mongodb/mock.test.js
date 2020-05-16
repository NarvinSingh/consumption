/* eslint-disable no-console */
import mongodb from 'mongodb';

jest.mock('mongodb');
let { ObjectID } = mongodb;

describe('tests', () => {
  test('Mock ObjectID', () => {
    const id = ObjectID();
    console.log('mock id', id);
    expect(id).toBeUndefined();
  });

  test('Actual ObjectID', () => {
    const realMongodb = jest.requireActual('mongodb');
    ObjectID = realMongodb.ObjectID;
    const id = ObjectID();
    console.log('real id', id);
    expect(id).not.toBeUndefined();
  });
});
