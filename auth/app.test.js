import 'dotenv/config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongodb from 'mongodb';
import request from '../modules/http-request.mjs';
import ExpressApp from '../modules/express/express-app.mjs';
import authApp from './app.mjs';

jest.mock('mongodb');
const { MongoClient, Db, Collection, Cursor, ObjectID } = mongodb;
MongoClient.prototype.connect.mockImplementation(function mockConnect() {
  return Promise.resolve(this);
});
MongoClient.prototype.isConnected.mockReturnValue(true);
MongoClient.prototype.db.mockReturnValue(new Db());
Db.prototype.collection.mockReturnValue(new Collection());
Collection.prototype.find.mockReturnValue(new Cursor());
function returnThis() { return this; }
Cursor.prototype.limit.mockImplementation(returnThis);
Cursor.prototype.collation.mockImplementation(returnThis);

const { summarize } = ExpressApp;
const authModel = authApp.models[0];
const events = [];
authApp.addObservers((notification) => {
  const { subjectName, componentName, event } = summarize(notification);
  events.push({ subjectName, componentName, event });
  // console.log({ subjectName, componentName, event });
});

const accessTokenPrivateKey = process.env.ACCESS_TOKEN_PRIVATE_KEY.replace(/\\n/g, '\n');
const refreshTokenPrivateKey = process.env.REFRESH_TOKEN_PRIVATE_KEY.replace(/\\n/g, '\n');

function mockFindUserByEmail(...rest) {
  const [error] = rest;
  const [id = 'user1234', email = 'tester@example.com', hash] = rest;
  if (error instanceof Error) Cursor.prototype.next.mockRejectedValueOnce(error);
  else Cursor.prototype.next.mockResolvedValueOnce({ _id: id, email, hash });
}

function mockInsertUser(...rest) {
  const [error] = rest;
  const [insertedCount = 1] = rest;
  if (error instanceof Error) Collection.prototype.insertOne.mockRejectedValueOnce(error);
  else Collection.prototype.insertOne.mockResolvedValueOnce({ insertedCount });
}

function mockVerifyRefreshToken(...rest) {
  const [error] = rest;
  const [findOneResult = { _id: 'refreshTokenId' }] = rest;
  ObjectID.mockReturnValueOnce('refreshTokenId');
  if (error instanceof Error) Collection.prototype.findOne.mockRejectedValueOnce(error);
  else Collection.prototype.findOne.mockResolvedValueOnce(findOneResult);
}

function mockInvalidateRefreshToken(...rest) {
  const [error] = rest;
  const [findOneAndDeleteResult = { ok: 1, value: { _id: 'refreshTokenId' } }] = rest;
  ObjectID.mockReturnValueOnce('refreshTokenId');
  if (error instanceof Error) Collection.prototype.findOneAndDelete.mockRejectedValueOnce(error);
  else Collection.prototype.findOneAndDelete.mockResolvedValueOnce(findOneAndDeleteResult);
}

function mockCreateTokens(...rest) {
  ObjectID.mockReturnValueOnce('createdRefreshTokenId');
  const [error] = rest;
  const [insertOneResult = { result: { ok: 1 }, insertedCount: 1 }] = rest;
  if (error instanceof Error) Collection.prototype.insertOne.mockRejectedValueOnce(error);
  else Collection.prototype.insertOne.mockResolvedValueOnce(insertOneResult);
}

beforeAll(async () => {
  await authApp.start();
});

beforeEach(() => { while (events.length) events.pop(); });

afterAll(async () => {
  await authApp.stop();
});

describe('auth app /users/register tests', () => {
  test('POST /users/register -> 201 user created', async () => {
    expect.assertions(2);
    mockInsertUser();

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com', password: 'Pass1234' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(201);
    expect(body).toStrictEqual({ status: 'ok', user: 'tester@example.com' });
  });

  test('POST /users/register -> 400 name missing', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { email: 'tester@example.com', password: 'Pass1234' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'name', message: 'missing' }] });
  });

  test('POST /users/register -> 400 name blank', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: '', email: 'tester@example.com', password: 'Pass1234' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'name', message: 'missing' }] });
  });

  test('POST /users/register -> 400 name too long', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      {
        name: '0123456789012345678901234567890123456789012345678901234567890123456789',
        email: 'tester@example.com',
        password: 'Pass1234',
      },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'name', message: 'length', max: 64 }] });
  });

  test('POST /users/register -> 400 email missing', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', password: 'Pass1234' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'email', message: 'missing' }] });
  });

  test('POST /users/register -> 400 email blank', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: '', password: 'Pass1234' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'email', message: 'missing' }] });
  });

  test('POST /users/register -> 400 email too long', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      {
        name: 'Tester',
        email: '012345678901234567890123456789012345678901234567890123456789@example.com',
        password: 'Pass1234',
      },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'email', message: 'length', max: 64 }] });
  });

  test('POST /users/register -> 400 password missing', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'password', message: 'missing' }] });
  });

  test('POST /users/register -> 400 password missing', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com', password: '' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'password', message: 'missing' }] });
  });

  test('POST /users/register -> 400 password too short', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com', password: 'Pass1' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body).toStrictEqual({
      status: 'failed',
      errors: [
        {
          name: 'password',
          message: 'length',
          min: 8,
          max: 20,
        },
      ],
    });
  });

  test('POST /users/register -> 400 password too long', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com', password: 'Pass12345678901234567' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body).toStrictEqual({
      status: 'failed',
      errors: [
        {
          name: 'password',
          message: 'length',
          min: 8,
          max: 20,
        },
      ],
    });
  });

  test('POST /users/register -> 400 password invalid', async () => {
    expect.assertions(2);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      {
        name: 'Tester',
        email: 'tester@example.com',
        password: 'pass1234',
      },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body).toStrictEqual({
      status: 'failed',
      errors: [
        {
          name: 'password',
          message: 'invalid',
          required: 'upper case, lower case, symbol',
        },
      ],
    });
  });

  test('POST /users/register -> 400 user exists', async () => {
    expect.assertions(2);
    mockFindUserByEmail();

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com', password: 'Pass1234' },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(400);
    expect(body)
      .toStrictEqual({ status: 'failed', errors: [{ name: 'email', message: 'exists' }] });
  });

  test('POST /users/register -> 500 find user', async () => {
    expect.assertions(2);
    mockFindUserByEmail(Error('find error'));

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com', password: 'Pass1234' },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'validateNewUser'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'validateNewUser',
          event: 'find error',
        },
      ]);
  });

  test('POST /users/register -> 500 insert user', async () => {
    expect.assertions(2);
    mockInsertUser(new Error('insert error'));

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com', password: 'Pass1234' },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'registerRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'registerRouter POST',
          event: 'insert error',
        },
      ]);
  });

  test('POST /users/register -> 500 user not created', async () => {
    expect.assertions(2);
    mockInsertUser(0);

    const result = await request.post(
      `http://localhost:${authApp.port}/users/register`,
      null,
      { name: 'Tester', email: 'tester@example.com', password: 'Pass1234' },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'registerRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'registerRouter POST',
          event: 'Unexpected insertedCount while inserting user: 0',
        },
      ]);
  });
});

describe('auth app /auth/token tests', () => {
  test('GET /auth/token/verify, bearer authentication access token -> 200', async () => {
    expect.assertions(4);
    const token = jwt.sign(
      { type: 'access' },
      accessTokenPrivateKey,
      {
        algorithm: 'RS256',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.ACCESS_TOKEN_TTL,
      },
    );

    const result = await request.get(
      `http://localhost:${authApp.port}/auth/token/verify`,
      { Authorization: `Bearer ${token}` },
    );

    const body = JSON.parse(result.body);
    expect(Object.keys(body)).toStrictEqual(['status', 'accessToken']);
    expect(body.status).toBe('ok');
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).not.toBeDefined();
  });

  test('GET /auth/token/verify, bearer authentication refresh token -> 200', async () => {
    expect.assertions(4);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();

    const result = await request.get(
      `http://localhost:${authApp.port}/auth/token/verify`,
      { Authorization: `Bearer ${token}` },
    );

    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(200);
    expect(Object.keys(body)).toStrictEqual(['status', 'refreshToken']);
    expect(body.status).toBe('ok');
    expect(body.refreshToken).toBeDefined();
  });

  test('GET /auth/token/verify, bearer authentication access token -> 401', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      accessTokenPrivateKey,
      {
        algorithm: 'RS256',
        issuer: 'Bad Issuer',
        subject: 'tester@example.com',
        expiresIn: process.env.ACCESS_TOKEN_TTL,
      },
    );

    const result = await request.get(
      `http://localhost:${authApp.port}/auth/token/verify`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(401);
  });

  test('GET /auth/token/verify, bearer authentication refresh token -> 401 ver n fnd', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Bad Issuer',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken(null);

    const result = await request.get(
      `http://localhost:${authApp.port}/auth/token/verify`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(401);
  });

  test('GET /auth/token/verify, bearer authentication refresh token -> 500 ver throw', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken(new Error('insert error'));

    const result = await request.get(
      `http://localhost:${authApp.port}/auth/token/verify`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'authenticateBearerRefresh'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'authenticateBearerRefresh',
          event: 'insert error',
        },
      ]);
  });

  test('POST /auth/token, invalid authentication -> 400', async () => {
    expect.assertions(1);

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: 'Bad' },
    );

    expect(result.statusCode).toBe(400);
  });

  test('POST /auth/token, no authentication -> 401', async () => {
    expect.assertions(1);

    const result = await request.post(`http://localhost:${authApp.port}/auth/token`);

    expect(result.statusCode).toBe(401);
  });

  test('POST /auth/token, basic authentication -> 200', async () => {
    expect.assertions(6);
    const pwd = 'Pass1234';
    const hash = await bcrypt.hash(pwd, 10);
    mockFindUserByEmail('user1234', 'tester@example.com', hash);
    mockCreateTokens();

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Basic ${Buffer.from(`tester@example.com:${pwd}`).toString('base64')}` },
    );

    const body = JSON.parse(result.body);
    expect(Object.keys(body)).toStrictEqual(['status', 'accessToken', 'refreshToken']);
    expect(result.statusCode).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(authModel.tokens.insertOne)
      .toHaveBeenLastCalledWith(expect.objectContaining({ _id: 'createdRefreshTokenId' }));
  });

  test('POST /auth/token, basic authentication -> 401', async () => {
    expect.assertions(1);
    const pwd = 'Pass1234';
    const badPwd = 'notthepassword';
    const hash = await bcrypt.hash(pwd, 10);
    mockFindUserByEmail('user1234', 'tester@example.com', hash);

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Basic ${Buffer.from(`tester@example.com:${badPwd}`).toString('base64')}` },
    );

    expect(result.statusCode).toBe(401);
  });

  test('POST /auth/token, basic authentication -> 500 find user', async () => {
    expect.assertions(2);
    mockFindUserByEmail(Error('find error'));

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Basic ${Buffer.from('tester@example.com:Pass1234').toString('base64')}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'authenticateBasic'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'authenticateBasic',
          event: 'find error',
        },
      ]);
  });

  test('POST /auth/token, basic authentication -> 500 create not ok', async () => {
    expect.assertions(2);
    const pwd = 'Pass1234';
    const hash = await bcrypt.hash(pwd, 10);
    mockFindUserByEmail('user1234', 'tester@example.com', hash);
    mockCreateTokens({ result: {}, insertedCount: 1 });

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Basic ${Buffer.from(`tester@example.com:${pwd}`).toString('base64')}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'insert not ok',
        },
      ]);
  });

  test('POST /auth/token, basic authentication -> 500 create not ins', async () => {
    expect.assertions(2);
    const pwd = 'Pass1234';
    const hash = await bcrypt.hash(pwd, 10);
    mockFindUserByEmail('user1234', 'tester@example.com', hash);
    mockCreateTokens({ result: { ok: 1 }, insertedCount: 0 });

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Basic ${Buffer.from(`tester@example.com:${pwd}`).toString('base64')}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'not inserted',
        },
      ]);
  });

  test('POST /auth/token, basic authentication -> 500 create throw', async () => {
    expect.assertions(2);
    const pwd = 'Pass1234';
    const hash = await bcrypt.hash(pwd, 10);
    mockFindUserByEmail('user1234', 'tester@example.com', hash);
    mockCreateTokens(new Error('create error'));

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Basic ${Buffer.from(`tester@example.com:${pwd}`).toString('base64')}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'create error',
        },
      ]);
  });

  test('POST /auth/token, bearer authentication access token -> 401', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'access' },
      accessTokenPrivateKey,
      {
        algorithm: 'RS256',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.ACCESS_TOKEN_TTL,
      },
    );

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(401);
  });

  test('POST /auth/token, bearer authentication refresh token -> 200', async () => {
    expect.assertions(7);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken();
    mockCreateTokens();

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    const body = JSON.parse(result.body);
    expect(Object.keys(body)).toStrictEqual(['status', 'accessToken', 'refreshToken']);
    expect(result.statusCode).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(authModel.tokens.findOneAndDelete)
      .toHaveBeenLastCalledWith({ _id: 'refreshTokenId' });
    expect(authModel.tokens.insertOne)
      .toHaveBeenLastCalledWith(expect.objectContaining({ _id: 'createdRefreshTokenId' }));
  });

  test('POST /auth/token, bearer authentication refresh token -> 401 ver not found', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken(null);

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(401);
  });

  test('POST /auth/token, bearer authentication refresh token -> 500 ver throw', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken(new Error('insert error'));

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'authenticateBearerRefresh'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'authenticateBearerRefresh',
          event: 'insert error',
        },
      ]);
  });

  test('POST /auth/token, bearer authentication refresh token -> 500 inv not ok', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken({ value: { _id: 'refreshTokenId' } });

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'find and delete not ok',
        },
      ]);
  });

  test('POST /auth/token, bearer authentication refresh token -> 500 inv not found', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken({ ok: 1, value: null });

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'not found',
        },
      ]);
  });

  test('POST /auth/token, bearer authentication refresh token -> 500 inv not del', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken({ ok: 1, value: { _id: 'notTheRefreshTokenId' } });

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'not deleted',
        },
      ]);
  });

  test('POST /auth/token, bearer authentication refresh token -> 500 inv throw', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken(new Error('invalidate error'));

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'invalidate error',
        },
      ]);
  });

  test('POST /auth/token, bearer authentication refresh token -> 500 create not ok', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken();
    mockCreateTokens({ result: {}, insertedCount: 1 });

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'insert not ok',
        },
      ]);
  });

  test('POST /auth/token, bearer authentication refresh token -> 500 create not ins', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken();
    mockCreateTokens({ result: { ok: 1 }, insertedCount: 0 });

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'not inserted',
        },
      ]);
  });

  test('POST /auth/token, bearer authentication refresh token -> 500 create throw', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken();
    mockCreateTokens(new Error('create error'));

    const result = await request.post(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter POST'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter POST',
          event: 'create error',
        },
      ]);
  });

  test('DELETE /auth/token, bearer authentication refresh token -> 204', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken();

    const result = await request.delete(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(204);
    expect(authModel.tokens.findOneAndDelete)
      .toHaveBeenLastCalledWith({ _id: 'refreshTokenId' });
  });

  test('DELETE /auth/token, bearer authentication refresh token -> 401 ver not found', async () => {
    expect.assertions(1);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken(null);

    const result = await request.delete(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(401);
  });

  test('DELETE /auth/token, bearer authentication refresh token -> 500 ver throw', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken(new Error('find error'));

    const result = await request.delete(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'authenticateBearerRefresh'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'authenticateBearerRefresh',
          event: 'find error',
        },
      ]);
  });

  test('DELETE /auth/token, bearer authentication refresh token -> 500 inv not ok', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken({ value: { _id: 'refreshTokenId' } });

    const result = await request.delete(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter DELETE'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter DELETE',
          event: 'find and delete not ok',
        },
      ]);
  });

  test('DELETE /auth/token, bearer authentication refresh token -> 500 inv not found', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken({ ok: 1, value: null });

    const result = await request.delete(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter DELETE'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter DELETE',
          event: 'not found',
        },
      ]);
  });

  test('DELETE /auth/token, bearer authentication refresh token -> 500 inv not del', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken({ ok: 1, value: { _id: 'notTheRefreshTokenId' } });

    const result = await request.delete(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter DELETE'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter DELETE',
          event: 'not deleted',
        },
      ]);
  });

  test('DELETE /auth/token, bearer authentication refresh token -> 500 inv throw', async () => {
    expect.assertions(2);
    const token = jwt.sign(
      { type: 'refresh' },
      refreshTokenPrivateKey,
      {
        algorithm: 'RS256',
        jwtid: 'refreshTokenId',
        issuer: 'Auth',
        subject: 'tester@example.com',
        expiresIn: process.env.REFRESH_TOKEN_TTL,
      },
    );
    mockVerifyRefreshToken();
    mockInvalidateRefreshToken(new Error('invalidate error'));

    const result = await request.delete(
      `http://localhost:${authApp.port}/auth/token`,
      { Authorization: `Bearer ${token}` },
    );

    expect(result.statusCode).toBe(500);
    expect(events.filter((event) => event.componentName === 'tokenRouter DELETE'))
      .toStrictEqual([
        {
          subjectName: 'Auth App',
          componentName: 'tokenRouter DELETE',
          event: 'invalidate error',
        },
      ]);
  });
});
