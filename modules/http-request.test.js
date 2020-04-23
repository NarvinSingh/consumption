import http from 'http';
import request from './http-request.mjs';

describe('http-request tests', () => {
  const port = 4000;
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

    server.listen(port, () => console.log(`server listening on port ${port}`));
  });

  afterAll(() => {
    server.close();
    console.log('server closed');
  });

  test('GET', async () => {
    expect.assertions(1);

    const result = await request.get(`http://localhost:${port}/users`);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'GET',
      url: '/users',
      headers: { host: `localhost:${port}`, connection: 'close' },
      body: '',
    });
  });

  test('GET with a param', async () => {
    expect.assertions(1);

    const result = await request.get(`http://localhost:${port}/users/123`);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'GET',
      url: '/users/123',
      headers: { host: `localhost:${port}`, connection: 'close' },
      body: '',
    });
  });

  test('GET with a query', async () => {
    expect.assertions(1);

    const result = await request.get(`http://localhost:${port}/users?id=123`);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'GET',
      url: '/users?id=123',
      headers: { host: `localhost:${port}`, connection: 'close' },
      body: '',
    });
  });

  test('GET with an additional header', async () => {
    expect.assertions(1);

    const result = await request.get(`http://localhost:${port}/users`, { 'test-header': 1 });
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'GET',
      url: '/users',
      headers: {
        host: `localhost:${port}`,
        'test-header': '1',
        connection: 'close',
      },
      body: '',
    });
  });

  test('POST', async () => {
    expect.assertions(1);

    const result = await request.post(`http://localhost:${port}/users`);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'POST',
      url: '/users',
      headers: {
        host: `localhost:${port}`,
        'content-length': '0',
        'content-type': 'text/plain',
        connection: 'close',
      },
      body: '',
    });
  });

  test('POST with a param', async () => {
    expect.assertions(1);

    const result = await request.post(`http://localhost:${port}/users/123`);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'POST',
      url: '/users/123',
      headers: {
        host: `localhost:${port}`,
        'content-length': '0',
        'content-type': 'text/plain',
        connection: 'close',
      },
      body: '',
    });
  });

  test('POST with an additional header', async () => {
    expect.assertions(1);

    const result = await request.post(`http://localhost:${port}/users`, { 'test-header': 1 });
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'POST',
      url: '/users',
      headers: {
        host: `localhost:${port}`,
        'content-length': '0',
        'content-type': 'text/plain',
        'test-header': '1',
        connection: 'close',
      },
      body: '',
    });
  });

  test('POST with a body', async () => {
    expect.assertions(1);

    const reqBody = { a: 1 };
    const reqStringBody = JSON.stringify(reqBody);
    const result = await request.post(`http://localhost:${port}/users`, null, reqBody);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'POST',
      url: '/users',
      headers: {
        host: `localhost:${port}`,
        'content-length': reqStringBody.length.toString(),
        'content-type': 'application/json',
        connection: 'close',
      },
      body: reqStringBody,
    });
  });

  test('DELETE', async () => {
    expect.assertions(1);

    const result = await request.delete(`http://localhost:${port}/users`);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'DELETE',
      url: '/users',
      headers: { host: `localhost:${port}`, connection: 'close' },
      body: '',
    });
  });

  test('DELETE with a param', async () => {
    expect.assertions(1);

    const result = await request.delete(`http://localhost:${port}/users/123`);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'DELETE',
      url: '/users/123',
      headers: { host: `localhost:${port}`, connection: 'close' },
      body: '',
    });
  });

  test('DELETE with a query', async () => {
    expect.assertions(1);

    const result = await request.delete(`http://localhost:${port}/users?id=123`);
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'DELETE',
      url: '/users?id=123',
      headers: { host: `localhost:${port}`, connection: 'close' },
      body: '',
    });
  });

  test('DELETE with an additional header', async () => {
    expect.assertions(1);

    const result = await request.delete(`http://localhost:${port}/users`, { 'test-header': 1 });
    const body = JSON.parse(result.body);

    expect(body).toStrictEqual({
      method: 'DELETE',
      url: '/users',
      headers: {
        host: `localhost:${port}`,
        'test-header': '1',
        connection: 'close',
      },
      body: '',
    });
  });
});
