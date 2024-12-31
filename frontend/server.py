from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver

PORT = 8000

Handler = SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
})

httpd = socketserver.TCPServer(("", PORT), Handler)
print(f"Serving at http://localhost:{PORT}")
httpd.serve_forever()
