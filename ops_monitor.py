import os
import sys
import time
import json
import signal
import subprocess
from datetime import datetime

import requests


APP_HOST = os.environ.get("MONITOR_HOST", "127.0.0.1")
APP_PORT = int(os.environ.get("MONITOR_PORT", os.environ.get("PORT", "5000")))
PING_URL = os.environ.get("MONITOR_PING_URL", f"http://{APP_HOST}:{APP_PORT}/chat/ping")
CHECK_INTERVAL_S = int(os.environ.get("MONITOR_INTERVAL_S", "15"))
FAIL_THRESHOLD = int(os.environ.get("MONITOR_FAIL_THRESHOLD", "4"))
OPS_WEBHOOK_URL = os.environ.get("OPS_WEBHOOK_URL", "")
LOG_FILE = os.environ.get("MONITOR_LOG_FILE", "ops_monitor.log")


def log(line: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    msg = f"[{ts}] {line}"
    print(msg, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except Exception:
        pass


def notify(level: str, text: str, extra=None):
    payload = {
        "level": level,
        "text": text,
        "time": datetime.now().isoformat(timespec="seconds"),
        "extra": extra or {},
    }
    log(f"notify level={level} text={text}")
    if not OPS_WEBHOOK_URL:
        return
    try:
        requests.post(OPS_WEBHOOK_URL, json=payload, timeout=5)
    except Exception as e:
        log(f"notify_failed err={type(e).__name__} {e}")


def start_app() -> subprocess.Popen:
    env = os.environ.copy()
    env.setdefault("FLASK_DEBUG", "0")
    cmd = [sys.executable, os.path.join(os.path.dirname(__file__), "app.py")]
    log(f"start_app cmd={' '.join(cmd)}")
    return subprocess.Popen(
        cmd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
    )


def stop_app(proc: subprocess.Popen):
    if proc.poll() is not None:
        return
    try:
        if os.name == "nt":
            proc.send_signal(signal.CTRL_BREAK_EVENT)
            time.sleep(1)
            proc.terminate()
        else:
            proc.terminate()
        try:
            proc.wait(timeout=10)
        except Exception:
            proc.kill()
    except Exception as e:
        log(f"stop_app_failed err={type(e).__name__} {e}")


def drain_stdout(proc: subprocess.Popen, max_lines=50):
    if not proc.stdout:
        return
    lines = 0
    while lines < max_lines:
        try:
            line = proc.stdout.readline()
        except Exception:
            break
        if not line:
            break
        log(f"app: {line.rstrip()}")
        lines += 1


def ping() -> tuple[bool, dict]:
    try:
        r = requests.get(PING_URL, timeout=3)
        ok = r.status_code == 200
        data = r.json() if ok else {"status_code": r.status_code, "text": r.text[:200]}
        return ok, data
    except Exception as e:
        return False, {"error": type(e).__name__, "detail": str(e)}


def main():
    notify("info", "monitor_start", {"ping_url": PING_URL})
    proc = start_app()
    fail_count = 0

    while True:
        if proc.poll() is not None:
            notify("error", "app_exited_restart", {"returncode": proc.returncode})
            proc = start_app()
            fail_count = 0
            time.sleep(2)

        drain_stdout(proc, max_lines=20)

        ok, data = ping()
        if ok:
            fail_count = 0
            log(f"ping_ok {json.dumps(data, ensure_ascii=False)}")
        else:
            fail_count += 1
            log(f"ping_fail count={fail_count} {json.dumps(data, ensure_ascii=False)}")
            if fail_count >= FAIL_THRESHOLD:
                notify("error", "ping_failed_restart", {"fail_count": fail_count, "detail": data})
                stop_app(proc)
                proc = start_app()
                fail_count = 0
                time.sleep(2)

        time.sleep(CHECK_INTERVAL_S)


if __name__ == "__main__":
    main()

