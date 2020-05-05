import Cleanup from '../cleanup.mjs';
import { makeObservableApp } from '../observable-app.mjs';
import connect from './connect.mjs';
import makeModelCollection from './model-collection.mjs';

const model = (Superclass = Object) => class Model extends Superclass {
  constructor(name, dbSpecs, ...superArgs) {
    super(...superArgs);
    this.name = name;
    this.dbSpecs = dbSpecs;
    this.state = 'disconnected';
  }

  connect() {
    if (this.state !== 'disconnected') return Promise.resolve(this);

    this.state = 'connecting';
    this.notify(null, 'connecting');
    this.dbs = {};
    this.cleanup = new Cleanup();
    this.cleanup.addObservers((signal) => { this.notify(null, signal); });

    return Promise.all(this.dbSpecs.map((spec) => {
      const { host, db: dbName, cols: colNames, username, password } = spec;
      const dbNotify = this.makeNotifier(dbName);
      const error = this.makeErrorCreator(dbName);

      dbNotify('connecting');
      const connectResult = connect(host, dbName, username, password).then((client) => {
        if (!client.isConnected()) throw error('failed to connect');
        const dbProp = {};
        this.dbs[dbName] = dbProp;
        colNames.forEach((colName) => {
          const ModelCollection = makeModelCollection(client.db(dbName).collection(colName));
          dbProp[colName] = new ModelCollection();
        });
        dbNotify('connected');
        return client;
      }).catch((reason) => { throw error(reason.message, reason); });

      this.cleanup.addCallbacks(() => connectResult.catch(() => {
        dbNotify('not connected');
        return 'not connected';
      }).then((client) => {
        if (client === 'not connected' || !client.isConnected()) return null;
        dbNotify('disconnecting');
        return client.close(); // returns undefined indicating client disconnected
      }).then((result) => {
        if (result === undefined) dbNotify('disconnected');
      }).catch((reason) => { dbNotify(reason); }));

      return connectResult;
    })).then(() => {
      this.state = 'connected';
      this.notify(null, 'connected');
      return this;
    }).catch((reason) => {
      const componentName = reason.details ? reason.details.componentName : null;
      this.notify(componentName, reason.message, reason);
      return this.disconnect();
    });
  }

  disconnect() {
    if (this.state === 'disconnected') return Promise.resolve(this);

    this.state = 'disconnecting';
    this.notify(null, 'disconnecting');
    return this.cleanup.runOnce('disconnect').then(() => {
      this.dbs = null;
      this.cleanup = null;
      this.state = 'disconnected';
      this.notify(null, 'disconnected');
      return this;
    });
  }
};

export function makeModel(base = Object) {
  return model(makeObservableApp(base));
}

export default makeModel();
