import express from 'express';
import validateNewUser from './validate-new-user.mjs';
import { createSuccessResponse } from './create-response.mjs';

const router = express.Router();

router.post('/', validateNewUser, async (req, res) => {
  const { name, email, password } = req.body;
  const { authModel, expressApp } = req.app.locals;

  try {
    const { insertedCount } = await authModel.insertUser(name, email, password);
    if (insertedCount === 1) res.status(201).json(createSuccessResponse({ user: email }));
    else throw new Error(`Unexpected insertedCount while inserting user: ${insertedCount}`);
  } catch (err) {
    expressApp.notify('registerRouter POST', err.message, err);
    res.sendStatus(500);
  }
});

export default router;
