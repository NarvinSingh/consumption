import express from 'express';
import connect from '../mongodb/connect.mjs';
import Cleanup from '../cleanup.mjs';
import curry from '../curry.mjs';
import mix from '../mix.mjs';
import observable from '../observable.mjs';

function notifyObservers(app, componentType, componentName, event, data = {}) {
  app.notifyObservers({ app, componentType, componentName, event, data });
}

function createError(app, componentType, componentName, message, data = {}) {
  const err = new Error(message);
  err.details = { app, componentType, componentName, data };
  return err;
}

function connectDb(app) {
  const { dbHost, db, dbUsername, dbPassword, cleanup } = app;

  if (!dbHost) return Promise.resolve(null);

  const notify = curry(notifyObservers, app, 'db', db);
  const error = curry(createError, app, 'db', db);

  notify('connecting');
  const connectResult = connect(dbHost, db, dbUsername, dbPassword).then((client) => {
    if (!client.isConnected()) throw error('failed to connect');
    notify('connected');
    return client;
  }).catch((reason) => { throw error(reason.message, reason); });

  cleanup.addCallbacks(() => {
    connectResult.catch(() => {
      notify('not connected');
    }).then((client) => {
      if (client && client.isConnected()) return client.close();
      return null;
    }).then((client) => {
      if (client === undefined) notify('disconnected');
    }).catch((reason) => { notify(reason.message, reason); });
  });

  return connectResult;
}

const expressApp = (Superclass = Object) => class ExpressApp extends Superclass {
  constructor(name = 'API', port = 3000, dbHost, db, dbCol, dbUsername, dbPassword, ...superArgs) {
    super(...superArgs);
    this.name = name;
    this.port = port;
    this.dbHost = dbHost;
    this.db = db;
    this.dbCol = dbCol;
    this.dbUsername = dbUsername;
    this.dbPassword = dbPassword;
    this.app = express();
  }

  startServer() {
    if (this.server) return this;

    const notify = curry(notifyObservers, this, 'server', this.name);
    this.cleanup = new Cleanup();
    this.cleanup.addObservers(notify);

    const { port, dbCol, app } = this;

    return connectDb(this).then((client) => {
      if (client) app.locals.dbCol = client.db().collection(dbCol);

      const listenResult = new Promise((resolve) => {
        this.server = app.listen(port, () => {
          notify('listening', { port });
          resolve(this);
        });
      });

      const errorResult = new Promise((resolve) => {
        this.server.on('error', (err) => {
          notify(err.message, err);
          this.stopServer().then(() => { resolve(this); });
        });
      });

      this.cleanup.addCallbacks(() => {
        if (this.server.listening) {
          return new Promise((resolve) => {
            this.server.close((err) => {
              if (err) notify(err.message, err);
              resolve();
            });
          }).then(() => {
            notify('closed');
          }).catch((reason) => {
            notify(reason.message, reason);
          });
        }
        return notify('not listening');
      });

      return Promise.race([listenResult, errorResult]);
    }).catch((reason) => {
      notify(reason.message, reason);
      return this.stopServer();
    });
  }

  stopServer() {
    return this.cleanup
      ? this.cleanup.runOnce('stop').then(() => {
        this.server = null;
        this.cleanup = null;
        return this;
      })
      : Promise.resolve(this);
  }
};

export default mix(expressApp, observable);
