const http = require("http");

function createProxy(listenPort, targetPortResolver, name) {
  const getTargetPort =
    typeof targetPortResolver === "function"
      ? targetPortResolver
      : () => targetPortResolver;

  const server = http.createServer((req, res) => {
    const targetPort = getTargetPort(req);
    console.log(`[${name}] Host: ${req.headers.host} -> Routing to :${targetPort} (${req.url})`);
    const options = {
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: req.headers.host || ("127.0.0.1:" + targetPort),
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
      console.error(`[${name} -> :${targetPort}] Proxy error:`, err.message);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end(`Bad Gateway: Unable to connect to upstream port ${targetPort}`);
      }
    });

    req.pipe(proxyReq, { end: true });
  });

  server.on("upgrade", (req, socket, head) => {
    const targetPort = getTargetPort(req);
    const options = {
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options);
    proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
      socket.write(
        `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n` +
          Object.entries(proxyRes.headers)
            .map(([k, v]) => `${k}: ${v}\r\n`)
            .join("") +
          "\r\n"
      );
      if (proxyHead && proxyHead.length) socket.write(proxyHead);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on("error", (err) => {
      console.error(`[${name} -> :${targetPort}] Upgrade error:`, err.message);
      socket.destroy();
    });

    proxyReq.end();
  });

  server.listen(listenPort, "0.0.0.0", () => {
    console.log(`[${name}] Listening on 0.0.0.0:${listenPort} (dynamic host routing enabled)`);
  });
}

// 3002: Web Frontend Router
// - test.ssestateandmarketing.com -> 5002 (Feature Branch Development)
// - ssestateandmarketing.com / others -> 4002 (Live Webapp)
createProxy(
  3002,
  (req) => {
    const host = (req.headers.host || "").toLowerCase();
    if (host.includes("test.ssestateandmarketing.com")) {
      return 5002;
    }
    return 4002;
  },
  "WEB-BRIDGE"
);

// 3001: API Backend Router
// - api-test.ssestateandmarketing.com -> 5001 (Feature API)
// - api.ssestateandmarketing.com / others -> 4001 (Live API)
createProxy(
  3001,
  (req) => {
    const host = (req.headers.host || "").toLowerCase();
    if (host.includes("api-test.ssestateandmarketing.com")) {
      return 5001;
    }
    return 4001;
  },
  "API-BRIDGE"
);
