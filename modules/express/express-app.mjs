import express from 'express';
import Cleanup from '../cleanup.mjs';
import ObservableApp from '../observable-app.mjs';
import { promisify } from '../utils.mjs';

const expressApp = (Superclass = Object) => class ExpressApp extends Superclass {
  constructor(name = 'API', port = 3000, models = [], ...superArgs) {
    super(...superArgs);
    this.name = name;
    this.port = port;
    this.models = models;
    this.app = express();
    this.state = 'stopped';
    models.forEach((model) => { model.addObservers((data) => this.notifyObservers(data)); });
    this.app.use((req, res, next) => {
      if (this.state !== 'started') {
        this.notify('server', 'not started', req);
        return res.sendStatus(500);
      }
      return next();
    });
  }

  start() {
    if (this.state !== 'stopped') return this;

    const { app, models, port } = this;
    const notify = this.makeNotifier('server');

    this.state = 'starting';
    notify('starting');
    this.cleanup = new Cleanup();
    this.cleanup.addObservers(notify);

    return Promise.all(models.map((model) => model.connect())).then(() => {
      if (models.some((model) => model.state !== 'connected')) return this.stop();

      app.locals.models = models;
      this.server = app.listen(port);
      const listenResult = promisify(this.server.on, this.server)('listening').then(() => {
        notify('listening', { port });
        notify('started');
        return this;
      });

      const errorResult = promisify(this.server.on, this.server)('error').catch((reason) => {
        notify(reason.message, reason);
        return this.stop();
      }).finally(() => this);

      this.cleanup.addCallbacks(() => {
        if (!this.server.listening) {
          notify('not listening');
          return Promise.all(models.map((model) => model.disconnect()));
        }

        notify('closing');
        return promisify(this.server.close, this.server)().then(() => {
          notify('closed');
        }).catch((reason) => {
          notify(reason);
        }).finally(() => Promise.all(models.map((model) => model.disconnect())));
      });

      return Promise.race([listenResult, errorResult]);
    }).catch((reason) => {
      notify(reason.message, reason);
      return this.stop();
    });
  }

  stop() {
    if (this.state === 'stopped') return Promise.resolve(this);

    const notify = this.makeNotifier('server');
    this.state = 'stopping';
    notify('stopping');
    return this.cleanup.runOnce('stop').then(() => {
      this.server = null;
      this.cleanup = null;
      this.state = 'stopped';
      notify('stopped');
      return this;
    });
  }
};

export default expressApp(ObservableApp);
