import 'dotenv/config.js';
import mongodb from 'mongodb';

const { MongoClient, ObjectID } = mongodb;
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DB}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let col;

client.connect()
  .then(() => {
    col = client.db().collection('users');
    return col.count({ name: 'Narvin' });
  })
  .then((count) => (count < 10 ? col.insertOne({ name: 'Narvin', timestamp: new Date() }) : null))
  .then((insertResult) => {
    if (insertResult) {
      const { insertedCount, insertedId } = insertResult;
      console.log('insert', insertedCount, insertedId);
    }

    let i = 0;
    return col.find({ name: 'Narvin' }).forEach((doc) => {
      i += 1;
      console.log(i, doc);
    });
  })
  .then(() => col.findOne(ObjectID('5e8d4bc1ea05d315ac15d5d4')))
  .then((doc) => {
    if (doc) {
      console.log('find', doc);
      console.log('typeof timestamp', typeof doc.timestamp);
    } else {
      console.log('5e8d4bc1ea05d315ac15d5d4 not found');
    }

    return col.findOne( { _id: ObjectID('5e8d4754e468ea1f082d513b') });
  })
  .then((doc) => {
    if (doc) {
      console.log('find', doc);
      console.log('typeof timestamp', typeof doc.timestamp);

      if (typeof doc.timestamp === 'number') {
        return col.findOneAndUpdate(
          { _id: ObjectID('5e8d4754e468ea1f082d513b') },
          { $set: { timestamp: new Date(1586317140077) } },
          { returnOriginal: false },
        );
      }

      console.log('5e8d4754e468ea1f082d513b not updated');
    } else {
      console.log('5e8d4754e468ea1f082d513b not found');
    }

    return null;
  })
  .then((result) => {
    if (result) {
      console.log('upsert', result.value);
    }
  })
  .catch((err) => console.log(err))
  .finally(() => {
    client.close();
    console.log('connection closed');
  });

// (async function asyncConnect() {
//   try {
//     const value1 = await client.connect();
//     console.log('connect.then value is client', value1 === client);
//     console.log('connected');
//     const value2 = await client.close();
//     console.log('connect.then.then value is undefined', value2 === undefined);
//     console.log('connection closed');
//   } catch (err) {
//     console.log(err);
//   }
//   console.log('done');
// }());
