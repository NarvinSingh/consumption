import bcrypt from 'bcrypt';
import { makeModel } from '../modules/mongodb/model.mjs';

const authModel = (Superclass = Object) => class AuthModel extends Superclass {
  constructor(
    name = 'Auth Model',
    dbSpec = {
      host: process.env.MONGODB_AUTH_HOST,
      db: process.env.MONGODB_AUTH_DB,
      cols: ['users', 'tokens'],
      username: process.env.MONGODB_AUTH_USERNAME,
      password: process.env.MONGODB_AUTH_PASSWORD,
    },
    ...superArgs
  ) {
    super(name, [dbSpec], ...superArgs);
    const { db } = dbSpec;
    this.addObservers((notification) => {
      const { componentName, event } = notification;
      if (componentName === db && event === 'connected') {
        this.users = this.dbs[db].users;
        this.tokens = this.dbs[db].tokens;
      }
    });
  }

  findUserByEmail(email) {
    return this.users.findOneIgnoreCase({ email });
  }

  async insertUser(name, email, password) {
    const hash = await bcrypt.hash(password, 10);
    return this.users.insertOne({ name, email, hash, timestamp: new Date() });
  }

  async authenticateUser(email, password) {
    const result = await this.findUserByEmail(email);
    return result && await bcrypt.compare(password, result.hash) && result;
  }

  authenticateRefreshToken(token) {
    const { jti } = token;
    return this.tokens.findById(jti);
  }

  insertRefreshToken() {
    return this.tokens.insertOne({ timestamp: new Date() });
  }

  deleteRefreshToken(token) {
    const { jti } = token;
    return this.tokens.deleteById(jti);
  }
};

export function makeAuthModel(base = Object) {
  return authModel(makeModel(base));
}

export default makeAuthModel();
