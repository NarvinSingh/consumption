import express from 'express';
import connect from '../mongodb/connect.mjs';
import Cleanup from '../cleanup.mjs';
import ObservableApp from '../observable-app.mjs';
import { promisify } from '../utils.mjs';

function connectDbs(app) {
  const { cleanup } = app;

  return Promise.all(app.dbSpecs.map((spec) => {
    const { host, db, username, password } = spec;

    const notify = app.makeNotifier(db);
    const error = app.makeErrorCreator(db);

    notify('connecting');
    const connectResult = connect(host, db, username, password).then((client) => {
      if (!client.isConnected()) throw error('failed to connect');
      notify('connected');
      return client;
    }).catch((reason) => { throw error(reason.message, reason); });

    cleanup.addCallbacks(() => connectResult.catch(() => {
      notify('not connected');
    }).then((client) => {
      if (client && client.isConnected()) return client.close();
      return null;
    }).then((client) => {
      if (client === undefined) notify('disconnected');
    }).catch((reason) => { notify(reason); }));

    return connectResult;
  }));
}

const expressApp = (Superclass = Object) => class ExpressApp extends Superclass {
  constructor(name = 'API', port = 3000, dbSpecs = [], ...superArgs) {
    super(...superArgs);
    this.name = name;
    this.port = port;
    this.dbSpecs = dbSpecs;
    this.app = express();
  }

  start() {
    if (this.server) return this;

    const notify = this.makeNotifier('server');
    this.cleanup = new Cleanup();
    this.cleanup.addObservers(notify);

    const { port, app } = this;

    return connectDbs(this).then((clients) => {
      app.locals.dbClients = clients;

      this.server = app.listen(port);
      const listenResult = promisify(this.server.on, this.server)('listening').then(() => {
        notify('listening', { port });
        return this;
      });

      const errorResult = promisify(this.server.on, this.server)('error').catch((reason) => {
        notify(reason.message, reason);
        return this.stop();
      }).finally(() => this);

      this.cleanup.addCallbacks(() => {
        if (this.server.listening) {
          return promisify(this.server.close, this.server)().then(() => {
            notify('closed');
          }).catch((reason) => {
            notify(reason);
          });
        }
        return notify('not listening');
      });

      return Promise.race([listenResult, errorResult]);
    }).catch((reason) => {
      notify(reason);
      return this.stop();
    });
  }

  stop() {
    return this.cleanup
      ? this.cleanup.runOnce('stop').then(() => {
        this.server = null;
        this.cleanup = null;
        return this;
      })
      : Promise.resolve(this);
  }
};

export default expressApp(ObservableApp);
