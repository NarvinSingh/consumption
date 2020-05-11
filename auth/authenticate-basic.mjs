export default async function authenticateBasic(req, res, next) {
  const { authModel, expressApp } = req.app.locals;

  try {
    if (req.isAuthenticated || req.authType !== 'Basic') return next();

    const decodedCreds = Buffer.from(req.authCreds, 'base64').toString('utf8');
    const [email, password] = decodedCreds.split(':');
    const user = await authModel.authenticateUser(email, password);
    if (!user) return res.sendStatus(401);

    req.isAuthenticated = true;
    req.user = user;
    return next();
  } catch (err) {
    expressApp.notify('authenticateBasic', err.message, err);
    return res.sendStatus(500);
  }
}
