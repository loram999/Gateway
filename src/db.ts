import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(process.cwd(), 'gateway.db');
const LOG_FILE = path.join(process.cwd(), 'gateway.log');
const ERROR_LOG_FILE = path.join(process.cwd(), 'gateway_errors.log');

export const db = new DatabaseSync(DB_PATH);

// Initialize relational tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      owner_name TEXT DEFAULT 'User',
      created_at TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS merchants (
      token TEXT PRIMARY KEY,
      merchant_name TEXT NOT NULL,
      domain TEXT DEFAULT '*',
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      token TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      workspace_id TEXT DEFAULT 'default',
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
      last5_digits TEXT
    );

    CREATE TABLE IF NOT EXISTS used_trx (
      trx_id TEXT PRIMARY KEY,
      used_at INTEGER NOT NULL,
      auth_token TEXT,
      amount REAL,
      source TEXT
    );

    CREATE TABLE IF NOT EXISTS gateway_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      forwarded_to_bot INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      balance REAL DEFAULT 0.0,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_merchant ON auth_tokens(merchant_token);
    CREATE INDEX IF NOT EXISTS idx_tokens_status ON auth_tokens(status);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON gateway_logs(created_at DESC);
  `);

  // Migrate columns if table already existed
  try { db.exec("ALTER TABLE accounts ADD COLUMN workspace_id TEXT DEFAULT 'default'"); } catch {}
  try { db.exec("ALTER TABLE auth_tokens ADD COLUMN workspace_id TEXT DEFAULT 'default'"); } catch {}

  // Seed default workspace
  try {
    const wsCount = (db.prepare('SELECT COUNT(*) as count FROM workspaces').get() as any)?.count || 0;
    if (wsCount === 0) {
      db.prepare(`
        INSERT INTO workspaces (id, name, api_key, owner_name, created_at)
        VALUES ('default', 'My Wave Workspace', 'wk_wave_live_a1b2c3d4e5f67890', 'Primary User', ?)
      `).run(new Date().toISOString());
    }
  } catch (err) {
    console.error('Error seeding workspace:', err);
  }

  // Migrate existing JSON data if SQLite database is empty
  seedFromExistingJson();
}

function seedFromExistingJson() {
  try {
    const accCountStmt = db.prepare('SELECT COUNT(*) as count FROM accounts');
    const accCount = (accCountStmt.get() as any)?.count || 0;

    if (accCount === 0) {
      const accountsJsonPath = path.join(process.cwd(), 'accounts.json');
      if (fs.existsSync(accountsJsonPath)) {
        const raw = fs.readFileSync(accountsJsonPath, 'utf-8');
        const accounts = JSON.parse(raw);
        const insertAcc = db.prepare(`
          INSERT OR REPLACE INTO accounts (phone, device_id, model, os_version, wmt_mfs, pin, balance, name, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `);
        const now = new Date().toISOString();
        for (const a of accounts) {
          insertAcc.run(
            a.phone,
            a.device_id || 'dev_' + Math.random().toString(36).slice(2),
            a.model || 'Pixel 7',
            String(a.os_version || '14'),
            a.wmt_mfs || '',
            a.pin || '',
            a.balance || 0.0,
            a.name || 'Wave User',
            now,
            now
          );
        }
      }
    }

    const merchCountStmt = db.prepare('SELECT COUNT(*) as count FROM merchants');
    const merchCount = (merchCountStmt.get() as any)?.count || 0;

    if (merchCount === 0) {
      const merchantsJsonPath = path.join(process.cwd(), 'merchants.json');
      if (fs.existsSync(merchantsJsonPath)) {
        const raw = fs.readFileSync(merchantsJsonPath, 'utf-8');
        const merchants = JSON.parse(raw);
        const insertMerch = db.prepare(`
          INSERT OR REPLACE INTO merchants (token, merchant_name, domain, active, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const m of merchants) {
          insertMerch.run(
            m.token,
            m.merchant_name,
            m.domain || '*',
            m.active !== false ? 1 : 0,
            m.created_at || new Date().toISOString()
          );
        }
      }
    }

    const usedCountStmt = db.prepare('SELECT COUNT(*) as count FROM used_trx');
    const usedCount = (usedCountStmt.get() as any)?.count || 0;

    if (usedCount === 0) {
      const usedJsonPath = path.join(process.cwd(), 'used_trx.json');
      if (fs.existsSync(usedJsonPath)) {
        const raw = fs.readFileSync(usedJsonPath, 'utf-8');
        const used = JSON.parse(raw);
        const insertUsed = db.prepare(`
          INSERT OR REPLACE INTO used_trx (trx_id, used_at, auth_token, amount, source)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const trx of used) {
          insertUsed.run(String(trx), Date.now(), 'legacy_seed', 0, 'seed');
        }
      }
    }
  } catch (err) {
    console.error('Error during JSON database migration:', err);
  }
}

// Structured Logging with file writing and Telegram bot notification
export function logGatewayEvent(
  eventType: string,
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS',
  message: string,
  details?: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? JSON.stringify(details) : '';
  const logLine = `[${timestamp}] [${level}] [${eventType}] ${message} ${detailsStr}\n`;

  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf-8');
    if (level === 'ERROR') {
      fs.appendFileSync(ERROR_LOG_FILE, logLine, 'utf-8');
    }
  } catch (err) {
    console.error('File logging error:', err);
  }

  // Insert into relational gateway_logs table
  try {
    const insertLog = db.prepare(`
      INSERT INTO gateway_logs (event_type, level, message, details, forwarded_to_bot, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    insertLog.run(eventType, level, message, detailsStr, timestamp);
  } catch (err) {
    console.error('DB log error:', err);
  }

  // Forward log to Telegram Bot
  forwardLogToTelegram(eventType, level, message, details);
}

// Forward Gateway Log to Telegram Bot Admin
async function forwardLogToTelegram(
  eventType: string,
  level: string,
  message: string,
  details?: Record<string, any>
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8950400071:AAElBLKypLuM0yChLlA3evIlLKLXaNjpvXk';
  const adminId = process.env.ADMIN_ID || '8353748526';

  if (!botToken || botToken === 'YOUR_BOT_TOKEN') return;

  const icon = level === 'ERROR' ? '🚨' : level === 'SUCCESS' ? '✅' : level === 'WARN' ? '⚠️' : '🔔';
  let formatted = `${icon} *GATEWAY LOG - ${eventType.toUpperCase()}*\n`;
  formatted += `*Level:* ${level}\n`;
  formatted += `*Message:* ${message}\n`;
  if (details) {
    formatted += `*Details:*\n\`\`\`json\n${JSON.stringify(details, null, 2).slice(0, 500)}\n\`\`\`\n`;
  }
  formatted += `_Time: ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Yangon' })} MMT_`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminId,
        text: formatted,
        parse_mode: 'Markdown',
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      // Silently ignore network blocks in sandbox
    }
  } catch (err) {
    // Keep local operation completely smooth even if Telegram API is unreachable in sandbox
  }
}
