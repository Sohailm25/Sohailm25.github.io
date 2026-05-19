"""ABOUTME: Pytest + Playwright fixtures for e2e tests.
ABOUTME: Builds Pelican output once per session and serves from a local HTTP server."""

import pathlib
import socket
import subprocess
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import pytest

REPO = pathlib.Path(__file__).parent.parent.parent
OUTPUT = REPO / "output"

@pytest.fixture(scope="session")
def site_server():
    subprocess.run(["uv", "run", "pelican", "content", "-s", "pelicanconf.py"],
                   cwd=REPO, check=True)
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]

    handler = lambda *a, **k: SimpleHTTPRequestHandler(*a, directory=str(OUTPUT), **k)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.1)
    yield f"http://127.0.0.1:{port}"
    server.shutdown()
