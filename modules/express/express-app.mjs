import express from 'express';
import Cleanup from '../cleanup.mjs';
import { makeObservableApp } from '../observable-app.mjs';
import { promisify } from '../utils.mjs';

const expressApp = (Superclass = Object) => class ExpressApp extends Superclass {
  constructor(name = 'API', port = 3000, models = [], ...superArgs) {
    super(...superArgs);
    this.subjectName = name;
    this.port = port;
    this.models = models;
    models.forEach((model) => { model.addObservers((data) => this.notifyObservers(data)); });
    this.state = 'stopped';
  }

  start() {
    if (this.state !== 'stopped') return this;

    const { models, port } = this;
    const notify = this.makeNotifier('server');

    this.state = 'starting';
    notify('starting');
    this.cleanup = new Cleanup();
    this.cleanup.addObservers(notify);

    return Promise.all(models.map((model) => model.connect())).then(() => {
      if (models.some((model) => model.state !== 'connected')) return this.stop();

      this.locals.models = models;
      this.server = this.listen(port);
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

function makeExpressApp(...expressAppArgs) {
  // The app returned by express is actually a function, so if we were to extend it, the object in
  // its prototype property be inserted into our prototype chain, and not the app itself. To insert
  // the app into the prototype chain, we make a new function with the app as its prototype
  // property, then extend the new function.
  function App() {}
  const app = express(); // save a reference to the app for when we override the listen method later
  App.prototype = app;

  // This class is unique because it extends a unique app
  const ExpressApp = expressApp(makeObservableApp(App));
  const instance = new ExpressApp(...expressAppArgs);

  // The app listen method creates an HTTP server and sets itself as the server's request callback.
  // Our ExpressApp would be the callback since it extends the app, so we must override the listen
  // method and once again make the app the callback

  // We need to rebind the app's own methods to the app instead of our instance so they continue to
  // work properly. This solution undermines a main reason for extending the app and indicates that
  // we should have our instance contain the app instead.
  Object
    .keys(app)
    .filter((key) => app[key] instanceof Function
      && key !== 'notify'
      && Object.prototype.hasOwnProperty.call(app, key))
    .forEach((key) => {
      instance[key] = app[key].bind(app);
    });

  instance.use((req, res, next) => {
    if (instance.state !== 'started') {
      instance.notify('server', 'not started', req);
      return res.sendStatus(500);
    }
    return next();
  });

  return instance;
}

export default makeExpressApp;
