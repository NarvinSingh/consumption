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

    if (options.method === 'POST' || options.method === 'PUT') {
      req.write(reqBody);
    }

    req.end();
  });
}

function prepareBodyAndHeaders(headers = null, body = '') {
  const finalHeaders = {};
  let contentType;
  let stringBody;

  if (headers) Object.assign(finalHeaders, headers);

  if (body.toString() === '[object Object]') {
    contentType = 'application/json';
    stringBody = JSON.stringify(body);
  } else {
    contentType = 'text/plain';
    stringBody = body.toString();
  }

  finalHeaders['Content-Type'] = contentType;
  finalHeaders['Content-Length'] = Buffer.byteLength(stringBody);

  return { stringBody, finalHeaders };
}

const httpRequest = {
  get(url, headers = null) {
    return request(url, { method: 'GET', headers });
  },

  post(url, headers = null, body = '') {
    const { stringBody, finalHeaders } = prepareBodyAndHeaders(headers, body);
    return request(url, { method: 'POST', headers: finalHeaders }, stringBody);
  },

  put(url, headers = null, body = '') {
    const { stringBody, finalHeaders } = prepareBodyAndHeaders(headers, body);
    return request(url, { method: 'PUT', headers: finalHeaders }, stringBody);
  },

  delete(url, headers = null) {
    return request(url, { method: 'DELETE', headers });
  },
};

export default httpRequest;
