export default function getCreds(req, res, next) {
  const { authorization: authHeader } = req.headers;
  if (!authHeader) return res.sendStatus(401);

  const [authType, authCreds] = authHeader.split(' ');
  if (!authType || !authCreds) return res.sendStatus(400);

  req.isAuthenticated = false;
  req.authType = authType;
  req.authCreds = authCreds;
  return next();
}
