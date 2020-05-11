import 'dotenv/config.js';
import express from 'express';
import {
  refresh as authenticateRefresh,
  basicRefresh as authenticateBasicRefresh,
  accessRefresh as authenticateAccessRefresh,
} from './authenticate.mjs';
import { createPayloadResponse, createTokenResponse } from './create-response.mjs';

const router = express.Router();

router.get('/verify', authenticateAccessRefresh, (req, res) => {
  res.json(createPayloadResponse(req.payload));
});

router.post('/', authenticateBasicRefresh, async (req, res) => {
  try {
    const { authModel } = req.app.locals;

    if (req.authType === 'Basic') {
      const { email } = req.user;
      const [accessToken, refreshToken] = await authModel.createTokens(email);
      return res.json(createTokenResponse(accessToken, refreshToken));
    }

    if (req.authType === 'Bearer') {
      const { payload } = req;
      const email = payload.sub;
      await authModel.invalidateRefreshToken(payload);
      const [accessToken, refreshToken] = await authModel.createTokens(email);
      return res.json(createTokenResponse(accessToken, refreshToken));
    }
  } catch (err) {
    const { expressApp } = req.app.locals;
    expressApp.notify('tokenRouter POST', err.message, err);
    return res.sendStatus(500);
  }

  return res.sendStatus(400);
});

router.delete('/', authenticateRefresh, async (req, res) => {
  const { authModel, expressApp } = req.app.locals;

  try {
    if (await authModel.invalidateRefreshToken(req.token)) return res.sendStatus(204);
  } catch (err) {
    expressApp.notify('tokenRouter DELETE', err.message, err);
    res.sendStatus(500);
  }

  return res.sendStatus(400);
});

export default router;
