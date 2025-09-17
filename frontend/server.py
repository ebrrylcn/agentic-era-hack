#!/usr/bin/env python3
"""
Simple HTTP server for Tour Guidance App development
Serves the frontend files and allows access to .env file
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        # Handle .env file requests by serving from parent directory
        if self.path == '/.env' or self.path == '/../.env':
            env_path = Path(__file__).parent.parent / '.env'
            if env_path.exists():
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                with open(env_path, 'r') as f:
                    self.wfile.write(f.read().encode())
                return
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'.env file not found')
                return

        # Default behavior for other files
        super().do_GET()

def run_server(port=8000):
    """Run the development server"""
    try:
        # Change to the directory containing this script
        os.chdir(Path(__file__).parent)

        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            print(f"🚀 Tour Guidance App server running at:")
            print(f"   http://localhost:{port}")
            print(f"   http://127.0.0.1:{port}")
            print()
            print("📁 Serving files from:", os.getcwd())
            print("🔑 .env file accessible from parent directory")
            print()
            print("Press Ctrl+C to stop the server")
            print("-" * 50)

            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n✅ Server stopped")

    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {port} is already in use")
            print(f"Try running with a different port: python server.py {port + 1}")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Allow custom port via command line argument
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ Invalid port number. Using default port 8000.")

    run_server(port)