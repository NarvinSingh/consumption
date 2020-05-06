import express from 'express';
import Cleanup from '../cleanup.mjs';
import { makeObservableApp } from '../observable-app.mjs';
import { promisify } from '../utils.mjs';

function makeCheckServerStarted(app) {
  return function checkServerStarted(req, res, next) {
    if (app.state !== 'started') {
      app.notify('server', 'not started', req);
      return res.sendStatus(500);
    }
    return next();
  };
}

const expressApp = (Superclass = Object) => class ExpressApp extends Superclass {
  constructor(name = 'API', port = 3000, models = [], ...superArgs) {
    super(...superArgs);
    this.subjectName = name;
    this.port = port;
    this.models = models;
    models.forEach((model) => { model.addObservers((data) => this.notifyObservers(data)); });

    const app = express();
    app.locals.expressApp = this;
    app.use(makeCheckServerStarted(this));
    this.app = app;

    this.state = 'stopped';
  }

  start() {
    if (this.state !== 'stopped') return this;

    const { port, models, app } = this;
    const notify = this.makeNotifier('server');

    this.state = 'starting';
    notify('starting');
    this.cleanup = new Cleanup(false, ['SIGINT', 'SIGQUIT', 'SIGTERM'], 0);
    this.cleanup.addObservers(notify);

    return Promise.all(models.map((model) => model.connect())).then(() => {
      if (models.some((model) => model.state !== 'connected')) return this.stop();

      this.server = app.listen(port);
      const listenResult = promisify(this.server.on, this.server)('listening').then(() => {
        notify('listening', { port });
        this.state = 'started';
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
        return Promise.all(models.map((model) => model.disconnect()))
          .catch((reason) => { notify(reason); })
          .then(() => promisify(this.server.close, this.server)())
          .then(() => { notify('closed'); })
          .catch((reason) => { notify(reason); });
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
    return this.cleanup.run('stop').then(() => {
      this.server = null;
      this.cleanup = null;
      this.state = 'stopped';
      notify('stopped');
      return this;
    });
  }
};

export function makeExpressApp(base = Object) {
  return expressApp(makeObservableApp(base));
}

export default makeExpressApp();
