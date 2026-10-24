"""
Relational SQLite Database & Logging Layer for Wave Money Gateway
Handles accounts, merchants, auth_tokens, used_trx, and gateway_logs.
Includes automatic file logging and Telegram Bot alert forwarding.
"""
from __future__ import annotations

import json
import logging
import os
import sqlite3
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gateway.db")
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gateway.log")
ERROR_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gateway_errors.log")

ADMIN_ID = int(os.getenv("ADMIN_ID", "8353748526"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8950400071:AAElBLKypLuM0yChLlA3evIlLKLXaNjpvXk")

db_lock = threading.Lock()

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables and seeds from JSON files if tables are empty."""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                api_key TEXT UNIQUE NOT NULL,
                owner_name TEXT DEFAULT 'User',
                created_at TEXT NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                phone TEXT PRIMARY KEY,
                workspace_id TEXT DEFAULT 'default',
                device_id TEXT NOT NULL,
                model TEXT NOT NULL,
                os_version TEXT NOT NULL,
                wmt_mfs TEXT DEFAULT '',
                pin TEXT DEFAULT '',
                balance REAL DEFAULT 0.0,
                name TEXT DEFAULT '',
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS merchants (
                token TEXT PRIMARY KEY,
                merchant_name TEXT NOT NULL,
                domain TEXT DEFAULT '*',
                active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auth_tokens (
                token TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                merchant_token TEXT NOT NULL,
                merchant_name TEXT DEFAULT '',
                domain TEXT DEFAULT '',
                amount REAL NOT NULL,
                phone_number TEXT,
                receiver TEXT,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                status TEXT NOT NULL,
                trx_id TEXT,
                executed_from TEXT,
                verified_at INTEGER,
                last5_digits TEXT,
                FOREIGN KEY (merchant_token) REFERENCES merchants(token)
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS used_trx (
                trx_id TEXT PRIMARY KEY,
                used_at INTEGER NOT NULL,
                auth_token TEXT,
                amount REAL,
                source TEXT
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gateway_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                details TEXT,
                forwarded_to_bot INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                balance REAL DEFAULT 0.0,
                updated_at TEXT NOT NULL
            );
        """)

        try:
            cursor.execute("ALTER TABLE accounts ADD COLUMN workspace_id TEXT DEFAULT 'default'")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE auth_tokens ADD COLUMN workspace_id TEXT DEFAULT 'default'")
        except Exception:
            pass

        cursor.execute("SELECT COUNT(*) FROM workspaces")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT OR IGNORE INTO workspaces (id, name, api_key, owner_name, created_at)
                VALUES ('default', 'My Wave Workspace', 'wk_wave_live_a1b2c3d4e5f67890', 'Primary User', ?)
            """, (datetime.now(timezone.utc).isoformat(),))

        conn.commit()
        conn.close()

    # Seed data if tables are empty
    seed_from_json()

def seed_from_json():
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()

    # Accounts
    cursor.execute("SELECT COUNT(*) FROM accounts")
    if cursor.fetchone()[0] == 0:
        json_file = "accounts.json"
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for a in data:
                        cursor.execute("""
                            INSERT OR REPLACE INTO accounts (phone, device_id, model, os_version, wmt_mfs, pin, balance, name, status, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
                        """, (
                            a.get("phone", ""),
                            a.get("device_id", "dev_default"),
                            a.get("model", "Pixel 7 Pro"),
                            str(a.get("os_version", "14")),
                            a.get("wmt_mfs", ""),
                            a.get("pin", ""),
                            float(a.get("balance", 0.0)),
                            a.get("name", "Wave SIM"),
                            now_str,
                            now_str
                        ))
                    conn.commit()
            except Exception as e:
                print(f"Error seeding accounts: {e}")

    # Merchants
    cursor.execute("SELECT COUNT(*) FROM merchants")
    if cursor.fetchone()[0] == 0:
        json_file = "merchants.json"
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for m in data:
                        cursor.execute("""
                            INSERT OR REPLACE INTO merchants (token, merchant_name, domain, active, created_at)
                            VALUES (?, ?, ?, ?, ?)
                        """, (
                            m.get("token", ""),
                            m.get("merchant_name", "Merchant"),
                            m.get("domain", "*"),
                            1 if m.get("active", True) else 0,
                            m.get("created_at", now_str)
                        ))
                    conn.commit()
            except Exception as e:
                print(f"Error seeding merchants: {e}")

    # Used TRX
    cursor.execute("SELECT COUNT(*) FROM used_trx")
    if cursor.fetchone()[0] == 0:
        json_file = "used_trx.json"
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for trx in data:
                        cursor.execute("""
                            INSERT OR REPLACE INTO used_trx (trx_id, used_at, auth_token, amount, source)
                            VALUES (?, ?, ?, ?, ?)
                        """, (str(trx), int(time.time() * 1000), "seed", 0.0, "seed"))
                    conn.commit()
            except Exception as e:
                print(f"Error seeding used_trx: {e}")

    conn.close()

def log_event(event_type: str, level: str, message: str, details: Optional[Dict[str, Any]] = None):
    """
    1. Writes to gateway.log / gateway_errors.log
    2. Saves to gateway_logs SQLite table
    3. Forwards notification to Telegram Bot Admin (ADMIN_ID)
    """
    now = datetime.now(timezone.utc).isoformat()
    details_str = json.dumps(details) if details else ""
    line = f"[{now}] [{level}] [{event_type}] {message} {details_str}\n"

    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line)
        if level == "ERROR":
            with open(ERROR_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(line)
    except Exception as e:
        print(f"Log file error: {e}")

    try:
        with db_lock:
            conn = get_connection()
            conn.execute("""
                INSERT INTO gateway_logs (event_type, level, message, details, forwarded_to_bot, created_at)
                VALUES (?, ?, ?, ?, 1, ?)
            """, (event_type, level, message, details_str, now))
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"DB log error: {e}")

    # Forward to Telegram Bot
    forward_to_telegram(event_type, level, message, details)

def forward_to_telegram(event_type: str, level: str, message: str, details: Optional[Dict[str, Any]] = None):
    """Sends log update directly to Telegram Admin chat."""
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN":
        return

    icon = "🚨" if level == "ERROR" else "✅" if level == "SUCCESS" else "⚠️" if level == "WARN" else "🔔"
    text = f"{icon} *GATEWAY EVENT: {event_type.upper()}*\n"
    text += f"*Level:* `{level}`\n"
    text += f"*Message:* {message}\n"
    if details:
        det_sample = json.dumps(details, indent=2)[:400]
        text += f"*Data:*\n```json\n{det_sample}\n```\n"
    text += f"_{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_"

    def _send():
        try:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            requests.post(url, json={"chat_id": ADMIN_ID, "text": text, "parse_mode": "Markdown"}, timeout=5)
        except Exception:
            pass

    threading.Thread(target=_send, daemon=True).start()
