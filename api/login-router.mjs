import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('GET API login handler');
});

export default router;
