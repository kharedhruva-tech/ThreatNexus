"""
WSL Bridge Agent for FalkorDB.
Runs inside WSL, maintains pre-connected worker sockets to the Windows bridge on 172.31.80.1:6382,
and forwards each active session directly to the real FalkorDB instance on 127.0.0.1:6379.
"""
import socket
import threading
import time
import sys

WINDOWS_HOST = "172.31.80.1"
BRIDGE_CONTROL_PORT = 6382
FALKORDB_PORT = 6379
POOL_TARGET = 12

def pipe_sockets(src, dst):
    try:
        while True:
            data = src.recv(16384)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try:
            src.close()
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass

def worker():
    while True:
        win_sock = None
        falkor_sock = None
        try:
            win_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            win_sock.connect((WINDOWS_HOST, BRIDGE_CONTROL_PORT))
            win_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            
            # Wait for activation token from Windows
            token = win_sock.recv(1)
            if not token or token != b'A':
                win_sock.close()
                time.sleep(0.1)
                continue
            
            # Connect to FalkorDB container
            falkor_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            falkor_sock.connect(("127.0.0.1", FALKORDB_PORT))
            falkor_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

            # Bidirectional pipe
            t1 = threading.Thread(target=pipe_sockets, args=(win_sock, falkor_sock), daemon=True)
            t2 = threading.Thread(target=pipe_sockets, args=(falkor_sock, win_sock), daemon=True)
            t1.start()
            t2.start()
            t1.join()
            t2.join()
        except Exception:
            if win_sock:
                try: win_sock.close()
                except Exception: pass
            if falkor_sock:
                try: falkor_sock.close()
                except Exception: pass
            time.sleep(0.2)

if __name__ == "__main__":
    print(f"WSL FalkorDB Agent started. Connecting to {WINDOWS_HOST}:{BRIDGE_CONTROL_PORT}...", flush=True)
    # Launch worker threads
    for _ in range(POOL_TARGET):
        threading.Thread(target=worker, daemon=True).start()
    
    # Keep main alive and monitor
    while True:
        time.sleep(1)
