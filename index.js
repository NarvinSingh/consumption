/*
Databases
  Auth
    tokens
    users
  Consumption
    lists

Endpoints
  POST /auth/token, basic authorization -> create access and refresh tokens, store refresh token
  POST /auth/token, bearer authorization -> if refresh token sent, create access token
  DELETE /auth/token bearer authorization -> if refresh token sent, delete refresh token
  POST /users/register -> create user
  GET /<protected route> -> verify
*/
// import { summarize } from './modules/express/express-app.mjs';
import ObservableApp from './modules/observable-app.mjs';
import authApp from './auth/app.mjs';
// import apiApp from './api/app.mjs';

authApp.addObservers((notification) => { console.log(ObservableApp.summarize(notification)); });
// apiApp.addObservers((msg) => { console.log(summarize(msg)); });
authApp.start().then(() => { console.log('index.js started auth server'); });
// apiApp.startServer().then(() => { console.log('index.js started API server'); });
