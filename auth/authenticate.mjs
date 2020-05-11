import getCreds from './get-creds.mjs';
import authenticateBasic from './authenticate-basic.mjs';
import authenticateBearerAccess from './authenticate-bearer-access.mjs';
import authenticateBearerRefresh from './authenticate-bearer-refresh.mjs';

function authenticate(req, res, next) {
  if (!req.isAuthenticated) return res.sendStatus(401);
  return next();
}

const basic = [getCreds, authenticateBasic, authenticate];
const access = [getCreds, authenticateBearerAccess, authenticate];
const refresh = [getCreds, authenticateBearerRefresh, authenticate];
const basicRefresh = [getCreds, authenticateBasic, authenticateBearerRefresh, authenticate];
const accessRefresh = [getCreds, authenticateBearerAccess, authenticateBearerRefresh, authenticate];

export { basic, access, refresh, basicRefresh, accessRefresh };
