import 'dotenv/config.js';
import express from 'express';
import registerRouter from './register-router.mjs';
import loginRouter from './login-router.mjs';
import logoutRouter from './logout-router.mjs';

const app = express();

app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/api/logout', logoutRouter);

app.listen(process.env.APP_PORT, () => {
  console.log(`API app is listening on port ${process.env.APP_PORT}`);
});
