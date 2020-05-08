import jwt from 'jsonwebtoken';
import { promisify } from './utils.mjs';
import generateRS256KeyPair from './crypto-utils.mjs';

describe('Crypto Utilities tests', () => {
  const sign = promisify(jwt.sign, jwt);

  test('Generate a pair of keys to sign and verify a JWT', async () => {
    expect.assertions(2);

    const keys = await generateRS256KeyPair();
    const otherKeys = await generateRS256KeyPair();
    const token = await sign({ subject: 'test' }, keys.privateKey, { algorithm: 'RS256' });

    expect(() => jwt.verify(token, otherKeys.publicKey)).toThrow('invalid signature');
    expect(jwt.verify(token, keys.publicKey)).toStrictEqual(jwt.decode(token));
  });
});
