import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from './utils.mjs';

const { JsonWebTokenError } = jwt;
const verify = promisify(jwt.verify, jwt);

function generateRs256KeyPair() {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      },
    );
  });
}

function verifyJwt(publicKey, issuer, audience, maxAge, token) {
  return verify(token, publicKey, { algorithms: ['RS256'], issuer, audience, maxAge })
    .catch((reason) => {
      if (reason instanceof JsonWebTokenError) {
        return { error: { name: reason.name, message: reason.message } };
      }
      throw reason;
    });
}

export { generateRs256KeyPair, verifyJwt };
