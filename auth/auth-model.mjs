import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { makeModel } from '../modules/mongodb/model.mjs';
import { verifyJwt } from '../modules/crypto-utils.mjs';
import { promisify, curry } from '../modules/utils.mjs';

const algorithm = 'RS256';
const sign = promisify(jwt.sign, jwt);

function toDate(seconds) {
  return new Date(seconds * 1000);
}

const authModel = (Superclass = Object) => class AuthModel extends Superclass {
  constructor(
    name = 'Auth Model',
    issuer = name.replace(/\smodel$/i, ''),
    dbSpec = {
      host: process.env.MONGODB_AUTH_HOST,
      db: process.env.MONGODB_AUTH_DB,
      cols: ['users', 'tokens'],
      username: process.env.MONGODB_AUTH_USERNAME,
      password: process.env.MONGODB_AUTH_PASSWORD,
    },
    keySpec = {
      accessTokenPrivateKey: process.env.ACCESS_TOKEN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      accessTokenPublicKey: process.env.ACCESS_TOKEN_PUBLIC_KEY.replace(/\\n/g, '\n'),
      accessTokenTtl: process.env.ACCESS_TOKEN_TTL,
      refreshTokenPrivateKey: process.env.REFRESH_TOKEN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      refreshTokenPublicKey: process.env.REFRESH_TOKEN_PUBLIC_KEY.replace(/\\n/g, '\n'),
      refreshTokenTtl: process.env.REFRESH_TOKEN_TTL,
    },
    ...superArgs
  ) {
    super(name, [dbSpec], ...superArgs);
    this.issuer = issuer;
    const { db } = dbSpec;
    this.addObservers((notification) => {
      const { componentName, event } = notification;
      if (componentName === db && event === 'connected') {
        this.users = this.dbs[db].users;
        this.tokens = this.dbs[db].tokens;
      }
    });
    this.keySpec = keySpec;
    this.verifyAccessJwt = curry(
      verifyJwt,
      keySpec.accessTokenPublicKey,
      issuer,
      keySpec.accessTokenTtl,
    );
    this.verifyRefreshJwt = curry(
      verifyJwt,
      keySpec.refreshTokenPublicKey,
      issuer,
      keySpec.refreshTokenTtl,
    );
  }

  findUserByEmail(email) {
    return this.users.findOneIgnoreCase({ email });
  }

  async authenticateUser(email, password) {
    const result = await this.findUserByEmail(email);
    return result && await bcrypt.compare(password, result.hash) && result;
  }

  async insertUser(name, email, password) {
    const hash = await bcrypt.hash(password, 10);
    return this.users.insertOne({ name, email, hash, timestamp: new Date() });
  }

  findRefreshToken(token) {
    return this.tokens.findById(token.jti);
  }

  createTokens(subject, claims = {}) {
    const { issuer } = this;
    const accessClaims = Object.assign(claims, { type: 'access' });
    const accessTokenResult = sign(
      accessClaims,
      this.keySpec.accessTokenPrivateKey,
      { algorithm, issuer, subject, expiresIn: this.keySpec.accessTokenTtl },
    );
    const refreshClaims = { type: 'refresh' };
    const id = this.tokens.constructor.createId();
    const jti = id.toString();
    const refreshTokenResult = sign(
      refreshClaims,
      this.keySpec.refreshTokenPrivateKey,
      {
        algorithm,
        jwtid: jti,
        issuer,
        subject,
        expiresIn: this.keySpec.refreshTokenTtl,
      },
    );
    const insertRefreshTokenResult = refreshTokenResult.then((refreshToken) => {
      const { iat, exp } = jwt.decode(refreshToken);
      return this.tokens.insertOne(
        { _id: id, issuer, subject, iat: toDate(iat), exp: toDate(exp) },
      );
    });
    return Promise.all([accessTokenResult, refreshTokenResult, insertRefreshTokenResult])
      .then(([accessToken, refreshToken, insertOneResult]) => {
        const { result, insertedCount } = insertOneResult;
        if (result.ok !== 1) return { status: 'failed', error: { message: 'insert not ok', jti } };
        if (insertedCount < 1) return { status: 'failed', error: { message: 'not inserted', jti } };
        return { status: 'created', accessToken, refreshToken };
      });
  }

  verifyAccessToken(token, audience) {
    const unverifiedPayload = jwt.decode(token);
    if (unverifiedPayload.type !== 'access') {
      return { status: 'failed', error: { message: 'not an access token' } };
    }
    return this.verifyAccessJwt(audience, token);
  }

  verifyRefreshToken(token, audience) {
    const unverifiedPayload = jwt.decode(token);
    if (unverifiedPayload.type !== 'refresh') {
      return { status: 'failed', error: { message: 'not a refresh token' } };
    }
    const verifyResult = this.verifyRefreshJwt(audience, token);
    const findTokenResult = verifyResult.then(() => this.findRefreshToken(token));
    return Promise.all([findTokenResult, verifyResult])
      .then(([foundToken, result]) => (!foundToken ? { ...result, status: 'failed' } : result));
  }

  invalidateRefreshToken(token) {
    const { jti } = token;
    return this.tokens.deleteById(jti).then((result) => {
      const { ok, value } = result;
      if (ok !== 1) return { status: 'failed', error: { message: 'find and delete not ok', jti } };
      if (value === null) return { status: 'failed', error: { message: 'not found', jti } };
      const { _id } = value;
      const deletedJti = _id.toString();
      if (deletedJti !== jti) return { status: 'failed', error: { message: 'not deleted', jti } };
      return { status: 'invalidated', jti };
    });
  }
};

export function makeAuthModel(base = Object) {
  return authModel(makeModel(base));
}

export default makeAuthModel();
