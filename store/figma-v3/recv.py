import http.server, os, sys
OUT = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'PUT,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_PUT(self):
        n = int(self.headers['Content-Length']); data = self.rfile.read(n)
        p = os.path.join(OUT, self.path.lstrip('/'))
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'wb').write(data)
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'ok')
    do_POST = do_PUT
    def do_GET(self):
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, fmt, *a): sys.stderr.write(fmt % a + '\n')
http.server.ThreadingHTTPServer(('127.0.0.1', 9232), H).serve_forever()
