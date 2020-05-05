import 'dotenv/config.js';
import express from 'express';
import ExpressApp from '../modules/express/express-app.mjs';
import AuthModel from './auth-model.mjs';
import registerRouter from './register-router.mjs';
// import tokenRouter from './token-router.mjs';

const authApp = new ExpressApp('Auth App', process.env.AUTH_PORT, [new AuthModel()]);
const { app } = authApp;

authApp.addObservers((notification) => {
  const { componentName, event } = notification;
  if (componentName === 'server' && event === 'started') {
    [app.locals.authModel] = authApp.models;
  }
});
app.use(express.json());
app.use('/users/register', registerRouter);
// app.use('/auth/token', tokenRouter);

export default authApp;
