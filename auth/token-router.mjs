import 'dotenv/config.js';
import express from 'express';
import jwt from 'jsonwebtoken';
import { promisify } from '../modules/utils.mjs';
import authenticate from './authenticate.mjs';

const router = express.Router();
const sign = promisify(jwt.sign, jwt);

async function createTokens(req) {
  const { user } = req;
  const { authModel } = req.app.locals;
  const accessTokenResult = sign(
    { type: 'access', user },
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: process.env.ACCESS_TOKEN_TTL },
  );
  const result = await authModel.insertRefreshToken();
  const refreshTokenResult = sign(
    { type: 'refresh', user },
    process.env.REFRESH_TOKEN_KEY,
    { jwtid: result.insertedId.toString(), expiresIn: process.env.REFRESH_TOKEN_TTL },
  );
  return Promise.all([accessTokenResult, refreshTokenResult]);
}

router.post('/', authenticate, async (req, res) => {
  try {
    const { user } = req;

    if (req.authType === 'Basic') {
      const [accessToken, refreshToken] = await createTokens(req);
      return res.json({ user, accessToken, refreshToken });
    }

    if (req.authType === 'Bearer') {
      const { type } = req.token;
      if (type !== 'refresh') return res.sendStatus(400);

      const [accessToken, refreshToken] = await createTokens(req);
      return res.json({ user, accessToken, refreshToken });
    }
  } catch (err) {
    const { expressApp } = req.app.locals;
    expressApp.notify('tokenRouter POST', err.message, err);
    return res.status(500).json({ message: err.message });
  }

  return res.sendStatus(400);
});

router.delete('/', authenticate, async (req, res) => {
  const { authModel, expressApp } = req.app.locals;

  try {
    if (req.authType === 'Bearer' && req.token.type === 'refresh') {
      if (await authModel.deleteRefreshToken(req.token)) return res.sendStatus(204);
    }
  } catch (err) {
    expressApp.notify('tokenRouter DELETE', err.message, err);
    res.status(500).json({ message: err.message });
  }

  return res.sendStatus(400);
});

export default router;
