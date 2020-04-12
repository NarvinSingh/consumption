import 'dotenv/config.js';
import express from 'express';
import Cleanup from '../modules/cleanup.mjs';
import connect from '../modules/mongodb/connect.mjs';
import registerRouter from './register-router.mjs';
import loginRouter from './login-router.mjs';
import logoutRouter from './logout-router.mjs';

const cleanup = new Cleanup();
const connectPromise = connect();

console.log(`Connecting to database ${process.env.MONGODB_DB}...`);

// Add a cleanup callback that will await the connect promise so that if a term signal is received
// before the connection is completed, we will wait for the connection to complete and close it
// beore exiting
cleanup.addCallbacks(async (signal) => {
  try {
    const client = await connectPromise;

    if (client.isConnected) {
      await client.close();
      console.log('Database connection closed');
    }
  } catch (err) {
    if (err && err.name !== signal) console.log(err);
  }
});

// Await the connect promise again to continue with the app
connectPromise.then((client) => {
  if (!client.isConnected) {
    throw new Error('Database is disconnected');
  }

  console.log(`Connected to database ${process.env.MONGODB_DB}`);

  return client;

// Start the server after we are connected to the db
}).then((client) => {
  const app = express();

  app.use('/api/register', registerRouter);
  app.use('/api/login', loginRouter);
  app.use('/api/logout', logoutRouter);

  const server = app.listen(process.env.API_PORT, () => {
    console.log(`The server is listening on port ${process.env.API_PORT}...`);
  });

  cleanup.addCallbacks(async () => {
    if (server.listening) {
      try {
        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log('Server closed');
      } catch (err) {
        console.log(err);
      }
    }
  });
}).catch((err) => {
  console.log(err);
  cleanup.runOnce(err.name || 'Exception', 1);
});
