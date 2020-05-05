import express from 'express';
import validateNewUser from './validate-new-user.mjs';

const router = express.Router();

router.post('/', validateNewUser, async (req, res) => {
  const { name, email, password } = req.body;
  const { authModel, expressApp } = req.app.locals;

  try {
    const result = await authModel.insertUser(name, email, password);
    res.status(201).json({ user: { id: result.insertedId, email } });
  } catch (err) {
    expressApp.notify('registerRouter', err.message, err);
    res.status(500).json({ errors: [{ name: err.name, message: err.message }] });
  }
});

export default router;
