export default async function authenticateBearer(req, res, next) {
  const { authModel, expressApp } = req.app.locals;

  try {
    if (req.isAuthenticated || req.authType !== 'Bearer') return next();

    const token = req.authCreds;
    const {
      status,
      error,
      payload,
    } = await authModel.verifyAccessToken(token, req.params.audience);
    if (error && error.message === 'not an access token') return next();
    if (status !== 'verified') return res.sendStatus(401);

    req.isAuthenticated = true;
    req.token = token;
    req.payload = payload;
    return next();
  } catch (err) {
    expressApp.notify('authenticateBearerAccess', err.message, err);
    return res.sendStatus(500);
  }
}
