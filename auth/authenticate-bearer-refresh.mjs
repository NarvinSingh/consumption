export default async function authenticateBearer(req, res, next) {
  const { authModel, expressApp } = req.app.locals;

  try {
    if (req.isAuthenticated || req.authType !== 'Bearer') return next();

    const token = req.authCreds;
    const result = await authModel.verifyRefreshToken(token, req.params.audience);
    if (result.status === 'not an refresh token') return next();
    if (result.status !== 'verified') return res.sendStatus(401);

    req.isAuthenticated = true;
    req.token = token;
    req.payload = result.payload;
    return next();
  } catch (err) {
    expressApp.notify('authenticateBearerRefresh', err.message, err);
    return res.sendStatus(500);
  }
}
