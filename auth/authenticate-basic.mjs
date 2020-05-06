export default async function authenticateBasic(req, res, next) {
  const { authModel, expressApp } = req.app.locals;

  try {
    if (req.isAuthenticated || req.authType !== 'Basic') return next();

    const decodedCreds = Buffer.from(req.authCreds, 'base64').toString('utf8');
    const [email, password] = decodedCreds.split(':');
    const result = await authModel.authenticateUser(email, password);
    if (!result) return res.sendStatus(401);

    req.isAuthenticated = true;
    // eslint-disable-next-line no-underscore-dangle
    req.user = { id: result._id, email: result.email };
    return next();
  } catch (err) {
    expressApp.notify('authenticateBasic', err.message, err);
    return res.status(500).json({ errors: [{ name: err.name, message: err.message }] });
  }
}
