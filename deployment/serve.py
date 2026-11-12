#!/usr/bin/env python3
"""Serve piano releases; always fetch the HTML entry and release metadata fresh."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

class PianoHandler(SimpleHTTPRequestHandler):
    def is_entry(self):
        return urlsplit(self.path).path in ('/', '/index.html', '/version.json', '/manifest.webmanifest')

    def send_head(self):
        if self.is_entry():
            # Old archives shared one mtime; stale conditional requests must not return 304.
            for header in ('If-Modified-Since', 'If-None-Match'):
                if header in self.headers:
                    del self.headers[header]
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store' if self.is_entry() else 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--bind', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=19080)
    parser.add_argument('--directory', required=True)
    args = parser.parse_args()
    ThreadingHTTPServer((args.bind, args.port), partial(PianoHandler, directory=args.directory)).serve_forever()
