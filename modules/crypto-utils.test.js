import jwt from 'jsonwebtoken';
import { generateRs256KeyPair, verifyJwt } from './crypto-utils.mjs';

describe('generateRs256KeyPair tests', () => {
  test('Generate a pair of keys to sign and verify a JWT', async () => {
    expect.assertions(2);

    const keys = await generateRs256KeyPair();
    const otherKeys = await generateRs256KeyPair();
    const token = jwt.sign({ subject: 'test' }, keys.privateKey, { algorithm: 'RS256' });

    expect(() => jwt.verify(token, otherKeys.publicKey)).toThrow('invalid signature');
    expect(jwt.verify(token, keys.publicKey)).toStrictEqual(jwt.decode(token));
  });
});

describe('verifyJwt tests', () => {
  let privateKey;
  let publicKey;

  beforeAll(async () => {
    const keys = await generateRs256KeyPair();
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;
  });

  test('Verifies a token', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      privateKey,
      {
        algorithm: 'RS256',
        issuer: 'Test Issuer',
        audience: 'Test API',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, 'Test Issuer', 'Test API', '1m', token);

    expect(result).toStrictEqual(expect.objectContaining({
      type: 'access',
      iss: 'Test Issuer',
      aud: 'Test API',
      sub: 'tester',
    }));
  });

  test('Verifies a token with any claims the if parameters are not specified', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      privateKey,
      {
        algorithm: 'RS256',
        issuer: 'Any Issuer',
        audience: 'Any API',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, undefined, undefined, undefined, token);

    expect(result).toStrictEqual(expect.objectContaining({
      type: 'access',
      iss: 'Any Issuer',
      aud: 'Any API',
      sub: 'tester',
    }));
  });

  test('Verifies a token without claims if parameters are not specified', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      privateKey,
      {
        algorithm: 'RS256',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, undefined, undefined, undefined, token);

    expect(result).toStrictEqual(expect.objectContaining({
      type: 'access',
      sub: 'tester',
    }));
  });

  test('Does not verify a token if the algorithm is wrong', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      'secret',
      {
        issuer: 'Test Issuer',
        audience: 'Test API',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt('secret', 'Test Issuer', 'Test API', '1m', token);

    expect(result).toStrictEqual({
      error: {
        name: 'JsonWebTokenError',
        message: 'invalid algorithm',
      },
    });
  });

  test('Does not verify a token if the public key is wrong', async () => {
    expect.assertions(1);
    const otherKeys = await generateRs256KeyPair();
    const token = jwt.sign(
      { type: 'access' },
      otherKeys.privateKey,
      {
        algorithm: 'RS256',
        issuer: 'Test Issuer',
        audience: 'Test API',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, 'Test Issuer', 'Test API', '1m', token);

    expect(result).toStrictEqual({
      error: {
        name: 'JsonWebTokenError',
        message: 'invalid signature',
      },
    });
  });

  test('Does not verify a token if the issuer is missing', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      privateKey,
      {
        algorithm: 'RS256',
        audience: 'Test API',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, 'Test Issuer', 'Test API', '1m', token);

    expect(result).toStrictEqual({
      error: {
        name: 'JsonWebTokenError',
        message: 'jwt issuer invalid. expected: Test Issuer',
      },
    });
  });

  test('Does not verify a token if the issuer is wrong', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      privateKey,
      {
        algorithm: 'RS256',
        issuer: 'Wrong Issuer',
        audience: 'Test API',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, 'Test Issuer', 'Test API', '1m', token);

    expect(result).toStrictEqual({
      error: {
        name: 'JsonWebTokenError',
        message: 'jwt issuer invalid. expected: Test Issuer',
      },
    });
  });

  test('Does not verify a token if the audience is missing', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      privateKey,
      {
        algorithm: 'RS256',
        issuer: 'Test Issuer',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, 'Test Issuer', 'Test API', '1m', token);

    expect(result).toStrictEqual({
      error: {
        name: 'JsonWebTokenError',
        message: 'jwt audience invalid. expected: Test API',
      },
    });
  });

  test('Does not verify a token if the audience is wrong', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      privateKey,
      {
        algorithm: 'RS256',
        issuer: 'Test Issuer',
        audience: 'Wrong API',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, 'Test Issuer', 'Test API', '1m', token);

    expect(result).toStrictEqual({
      error: {
        name: 'JsonWebTokenError',
        message: 'jwt audience invalid. expected: Test API',
      },
    });
  });

  test('Does not verify a token if the max age is exceeded', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      privateKey,
      {
        algorithm: 'RS256',
        issuer: 'Test Issuer',
        audience: 'Test API',
        subject: 'tester',
        expiresIn: '1m',
      },
    );

    const result = await verifyJwt(publicKey, 'Test Issuer', 'Test API', '0ms', token);

    expect(result).toStrictEqual({
      error: {
        name: 'TokenExpiredError',
        message: 'maxAge exceeded',
      },
    });
  });
});
