import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('GET API logout handler');
});

export default router;
