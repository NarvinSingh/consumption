import http from 'http';

function request(url, options, reqBody = '') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      const { statusCode, statusMessage, headers } = res;
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode,
          statusMessage,
          headers,
          body,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.method === 'POST') {
      req.write(reqBody);
    }

    req.end();
  });
}

const httpRequest = {
  get(url) {
    return request(url, { method: 'GET' });
  },

  post(url, body = '') {
    let contentType;
    let stringBody;

    if (body.toString() === '[object Object]') {
      contentType = 'application/json';
      stringBody = JSON.stringify(body);
    } else {
      contentType = 'text/plain';
      stringBody = body.toString();
    }

    return request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': contentType, 'Content-Length': Buffer.byteLength(stringBody) },
      },
      stringBody,
    );
  },
};

export default httpRequest;
