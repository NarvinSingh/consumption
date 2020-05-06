import 'dotenv/config.js';
import jwt from 'jsonwebtoken';
import { promisify } from '../modules/utils.mjs';

const { JsonWebTokenError } = jwt;
const verify = promisify(jwt.verify, jwt);

export default async function authenticateBearer(req, res, next) {
  const { authModel, expressApp } = req.app.locals;

  try {
    if (req.isAuthenticated || req.authType !== 'Bearer') return next();

    const { authCreds } = req;
    const token = jwt.decode(authCreds);
    const { type } = token;
    const key = process.env[`${type.toUpperCase()}_TOKEN_KEY`];

    if (key) {
      if (!await verify(authCreds, key)) return res.sendStatus(401);

      if (type === 'refresh') {
        if (!await authModel.authenticateRefreshToken(token)) return res.sendStatus(401);
      }

      req.isAuthenticated = true;
      req.token = token;
      req.user = token.user;
      return next();
    }

    return res.sendStatus(401);
  } catch (err) {
    if (err instanceof JsonWebTokenError) return res.sendStatus(401);
    expressApp.notify('authenticateBearer', err.message, err);
    return res.status(500).json({ errors: [{ name: err.name, message: err.message }] });
  }
}
