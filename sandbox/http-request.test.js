import http from 'http';
import request from './http-request.mjs';

describe('http-request tests', () => {
  let server;

  beforeAll(() => {
    server = http.createServer((req, res) => {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body,
        }));
      });
    });

    server.listen(4000, () => console.log('server listening on port 4000'));
  });

  afterAll(() => {
    server.close();
    console.log('server closed');
  });

  test('GET', async () => {
    expect.assertions(1);

    const result = await request.get('http://localhost:4000/users');
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'GET',
      url: '/users',
      headers: { host: 'localhost:4000', connection: 'close' },
      body: '',
    });
  });

  test('GET with a param', async () => {
    expect.assertions(1);

    const result = await request.get('http://localhost:4000/users/123');
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'GET',
      url: '/users/123',
      headers: { host: 'localhost:4000', connection: 'close' },
      body: '',
    });
  });

  test('GET with a query', async () => {
    expect.assertions(1);

    const result = await request.get('http://localhost:4000/users?id=123');
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'GET',
      url: '/users?id=123',
      headers: { host: 'localhost:4000', connection: 'close' },
      body: '',
    });
  });

  test('POST', async () => {
    expect.assertions(1);

    const result = await request.post('http://localhost:4000/users');
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'POST',
      url: '/users',
      headers: {
        host: 'localhost:4000',
        'content-length': '0',
        'content-type': 'text/plain',
        connection: 'close',
      },
      body: '',
    });
  });

  test('POST with a param', async () => {
    expect.assertions(1);

    const result = await request.post('http://localhost:4000/users/123');
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'POST',
      url: '/users/123',
      headers: {
        host: 'localhost:4000',
        'content-length': '0',
        'content-type': 'text/plain',
        connection: 'close',
      },
      body: '',
    });
  });

  test('POST with a body', async () => {
    expect.assertions(1);

    const reqBody = { a: 1 };
    const reqStringBody = JSON.stringify(reqBody);
    const result = await request.post('http://localhost:4000/users', reqBody);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'POST',
      url: '/users',
      headers: {
        host: 'localhost:4000',
        'content-length': reqStringBody.length.toString(),
        'content-type': 'application/json',
        connection: 'close',
      },
      body: reqStringBody,
    });
  });
});
