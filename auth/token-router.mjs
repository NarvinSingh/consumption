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
      const { error, accessToken, refreshToken } = await authModel.createTokens(email);
      if (error) throw new Error(error.message);
      return res.json(createTokenResponse(accessToken, refreshToken));
    }

    if (req.authType === 'Bearer') {
      const { payload } = req;
      const email = payload.sub;
      const { error: invError } = await authModel.invalidateRefreshToken(payload);
      if (invError) throw new Error(invError.message);
      const { error, accessToken, refreshToken } = await authModel.createTokens(email);
      if (error) throw new Error(error.message);
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
  const { payload } = req;

  try {
    const invResult = await authModel.invalidateRefreshToken(payload);
    if (invResult.status !== 'invalidated') throw new Error(invResult.error.message);
    return res.sendStatus(204);
  } catch (err) {
    expressApp.notify('tokenRouter DELETE', err.message, err);
    return res.sendStatus(500);
  }
});

export default router;
