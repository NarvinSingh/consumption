import 'dotenv/config.js';
import express from 'express';
import Cleanup from '../modules/cleanup.mjs';
import connect from '../modules/mongodb/connect.mjs';
import registerRouter from './register-router.mjs';
import loginRouter from './login-router.mjs';
import logoutRouter from './logout-router.mjs';

const cleanup = new Cleanup();

// Connect to the db first
console.log(`Connecting to database ${process.env.MONGODB_DB}...`);
connect().then((client) => {
  if (!client.isConnected) {
    throw new Error('Database is disconnected');
  }

  console.log(`Connected to database ${process.env.MONGODB_DB}`);
  cleanup.addCallbacks(async () => {
    if (client.isConnected) {
      try {
        await client.close();
        console.log('Database connection closed');
      } catch (err) {
        console.log(err);
      }
    }
  });

  return client;

// Only start the server once connected to the db
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
  cleanup.run('Exception', 1);
});
