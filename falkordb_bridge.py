"""
FalkorDB Localhost TCP Bridge (Windows Host Service).
Binds 127.0.0.1:6379 on Windows, routing connections to the real FalkorDB
container running in WSL via pre-warmed reverse sockets.
"""
import socket
import threading
import subprocess
import time
import os
import sys

CLIENT_PORT = 6379
CONTROL_PORT = 6382
BUFFER_SIZE = 16384

class FalkorDBBridge:
    def __init__(self, client_port=CLIENT_PORT, control_port=CONTROL_PORT):
        self.client_port = client_port
        self.control_port = control_port
        self.available_workers = []
        self.lock = threading.Lock()
        self.cond = threading.Condition(self.lock)
        self.running = False
        self.wsl_proc = None

    def start_wsl_agent(self):
        wsl_script = "/mnt/d/PROJECT/ai-agent/wsl_bridge_agent.py"
        try:
            self.wsl_proc = subprocess.Popen(
                ["wsl", "-u", "root", "-d", "Ubuntu", "--", "python3", wsl_script],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print("Launched WSL Bridge Agent subprocess.", flush=True)
        except Exception as e:
            print(f"Failed to launch WSL Bridge Agent: {e}", file=sys.stderr, flush=True)

    def _pipe(self, src, dst):
        try:
            while self.running:
                data = src.recv(BUFFER_SIZE)
                if not data:
                    break
                dst.sendall(data)
        except Exception:
            pass
        finally:
            try: src.close()
            except Exception: pass
            try: dst.close()
            except Exception: pass

    def _control_listener_thread(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("0.0.0.0", self.control_port))
        server.listen(128)
        print(f"Bridge control listener active on 0.0.0.0:{self.control_port}", flush=True)

        while self.running:
            try:
                sock, addr = server.accept()
                sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                with self.cond:
                    self.available_workers.append(sock)
                    self.cond.notify()
            except Exception:
                if not self.running:
                    break
                time.sleep(0.1)
        try: server.close()
        except Exception: pass

    def _client_listener_thread(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("127.0.0.1", self.client_port))
        server.listen(128)
        print(f"FalkorDB client listener active on 127.0.0.1:{self.client_port}", flush=True)

        while self.running:
            try:
                client_sock, addr = server.accept()
                client_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                
                # Fetch a worker socket from the pool
                worker_sock = None
                with self.cond:
                    while self.running and not self.available_workers:
                        self.cond.wait(timeout=2.0)
                    if self.available_workers:
                        worker_sock = self.available_workers.pop(0)

                if not worker_sock:
                    client_sock.close()
                    continue

                # Send activation token to the worker
                try:
                    worker_sock.sendall(b'A')
                except Exception:
                    client_sock.close()
                    try: worker_sock.close()
                    except Exception: pass
                    continue

                # Pipe bidirectionally
                t1 = threading.Thread(target=self._pipe, args=(client_sock, worker_sock), daemon=True)
                t2 = threading.Thread(target=self._pipe, args=(worker_sock, client_sock), daemon=True)
                t1.start()
                t2.start()
            except Exception:
                if not self.running:
                    break
                time.sleep(0.05)
        try: server.close()
        except Exception: pass

    def run(self):
        self.running = True
        t_ctl = threading.Thread(target=self._control_listener_thread, daemon=True)
        t_ctl.start()
        
        # Give control listener a moment to bind, then start WSL agent
        time.sleep(0.2)
        self.start_wsl_agent()

        t_cli = threading.Thread(target=self._client_listener_thread, daemon=True)
        t_cli.start()

        # Monitor and keep alive
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        self.running = False
        if self.wsl_proc:
            try: self.wsl_proc.terminate()
            except Exception: pass

if __name__ == "__main__":
    bridge = FalkorDBBridge()
    bridge.run()
