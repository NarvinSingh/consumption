import { createFailureResponse } from './create-response.mjs';

const namePattern = new RegExp(/^[a-z]/i);
const maxNameLen = 64;
const emailPattern = new RegExp(/^\w+(\.?\w)+@([a-z][-\w]*\.)*[a-z]{2,}\.[a-z]{2,63}$/i);
const maxEmailLen = 64;
const passwordPatterns = [
  new RegExp(/[a-z]/),
  new RegExp(/[A-Z]/),
  new RegExp(/[-0-9_!@#$%^&*()+*=\\/{}[\]:;"'<>,.?|]/),
];
const minPasswordLen = 8;
const maxPasswordLen = 20;

export default async function validateNewUser(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (name === undefined || !name.length) errors.push({ name: 'name', message: 'missing' });
  else if (name.length > maxNameLen) {
    errors.push({ name: 'name', message: 'length', max: maxNameLen });
  } else if (!namePattern.test(name)) errors.push({ name: 'name', message: 'invalid' });

  if (email === undefined || !email.length) errors.push({ name: 'email', message: 'missing' });
  else if (email.length > maxEmailLen) {
    errors.push({ name: 'email', message: 'length', max: maxEmailLen });
  } else if (!emailPattern.test(email)) errors.push({ name: 'email', message: 'invalid' });

  if (password === undefined || !password.length) {
    errors.push({ name: 'password', message: 'missing' });
  } else if (password.length < minPasswordLen || password.length > maxPasswordLen) {
    errors.push({ name: 'password', message: 'length', min: minPasswordLen, max: maxPasswordLen });
  } else if (!passwordPatterns.every((pattern) => pattern.test(password))) {
    errors.push({
      name: 'password',
      message: 'invalid',
      required: 'upper case, lower case, symbol',
    });
  }

  const { authModel, expressApp } = req.app.locals;

  try {
    const doc = await authModel.findUserByEmail(email);
    if (doc) errors.push({ name: 'email', message: 'exists' });
  } catch (err) {
    expressApp.notify('validateNewUser', err.message, err);
    return res.sendStatus(500);
  }

  if (errors.length) return res.status(400).json(createFailureResponse(errors));
  return next();
}
