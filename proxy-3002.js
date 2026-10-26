const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 4002,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: Unable to connect to upstream 4002');
    }
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(3002, '0.0.0.0', () => {
  console.log('Bridge proxy running on port 3002 -> forwarding to 4002');
});
