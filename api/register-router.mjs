import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('GET API register handler');
});

export default router;
