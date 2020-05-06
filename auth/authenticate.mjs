import getCreds from './get-creds.mjs';
import authenticateBasic from './authenticate-basic.mjs';
import authenticateBearer from './authenticate-bearer.mjs';

function authenticate(req, res, next) {
  if (!req.isAuthenticated) return res.sendStatus(401);
  return next();
}

export default [getCreds, authenticateBasic, authenticateBearer, authenticate];
