# Wave Money API Payment Gateway & Telegram Bot

A production-ready Payment Gateway and Admin Telegram Bot for Myanmar's Wave Money (WavePay).

---

## ⚡ Core Architecture

1. **Relational Database (`gateway.db` via SQLite)**
   - Migrated from flat JSON files to a relational schema:
     - `accounts`: Wave SIM credentials, device IDs, balances, and `wmt_mfs` tokens.
     - `merchants`: Authorized external merchant accounts with 32-character hex API keys.
     - `auth_tokens`: 15-minute deposit tokens and 5-minute withdrawal tokens with lifecycle states.
     - `used_trx`: Enforces strict single-use transaction ID uniqueness against replay attacks.
     - `gateway_logs`: Audit log for every API call, state transition, and error.

2. **Deposit Verification with Transaction ID Last-5 Digits Matching**
   - **ငွေသွင်းအတည်ပြုခြင်း**: Merchants or customers submit the last 5 digits of the Wave Pay Transaction ID (e.g., `09482`).
   - The engine scrapes the assigned Wave SIM's transaction history via `curl_cffi` Cloudflare bypass.
   - It matches any record ending with those 5 digits with matching amount, checks that the ID has not been used before, marks the deposit as successful, and credits the balance!

3. **Live Gateway Log Forwarding to Telegram Bot**
   - **Gateway Logs တွေအကုန် Bot ကိုတက်**: Every deposit request, verification, withdrawal, SIM login, or error automatically formats a Markdown notification and sends it directly to the Telegram Admin (`ADMIN_ID: 8353748526`).
   - Also written to `gateway.log` and `gateway_errors.log`.

4. **Master Admin Panel (`/admin990`)**
   - Access via secret web URL `/admin990` or Telegram command `/admin990`.
   - Full master control: live Telegram event stream, transaction unblocking (dispute release), balance adjustments, merchant token revoking, and SIM pool management.

5. **Wave Account Management Page**
   - Dedicated dashboard view for registering new SIMs, sending OTP, verifying PIN, initiating P2P transfers, and inspecting transaction history.

6. **Merchant Self-Service Dashboard**
   - External merchants log in with their 32-character hex token to monitor their deposit and withdrawal volume, track request status, and generate payment links.

3. **Flask REST API Endpoints**
   - `POST /api/request-deposit`
     - Params: `{ "amount": 50000, "merchant_token": "...", "domain": "example.com" }`
     - Validates token & domain, assigns random logged-in Wave account, generates UUID `auth_token` valid for 15 minutes.
   - `POST /api/verify-deposit`
     - Params: `{ "auth_token": "..." }`
     - Checks token validity ($<15$ mins), fetches last 5 transactions of assigned account, verifies amount matches and transaction ID has **never** been used before (checked against `used_trx.json`).
   - `POST /api/request-withdraw`
     - Params: `{ "amount": 25000, "phone": "09...", "merchant_token": "..." }`
     - Validates merchant, generates `withdraw_token` valid for 5 minutes.
   - `POST /api/confirm-withdraw`
     - Params: `{ "withdraw_token": "...", "receiver": "09..." }`
     - Checks token validity ($<5$ mins), picks Wave account with the highest balance, executes transfer.

4. **Database Flat Files**
   - `accounts.json`: Registered Wave Money accounts and session tokens.
   - `merchants.json`: Authorized external merchants and 32-character hex API keys.
   - `auth_tokens.json`: Deposit `auth_token` and withdrawal `withdraw_token` records with expiration timestamps.
   - `used_trx.json`: Settled transaction IDs to guarantee transaction uniqueness and prevent replay attacks.
   - `users.json`: Telegram user balances.

5. **Multi-Threaded Execution**
   - Runs Flask on background daemon thread: `threading.Thread(target=run_flask, daemon=True)`.
   - Runs Telegram Bot polling on main thread.
   - Auto-detects local IPv4 and prints `http://<local_ip>:5000` on startup.

---

## 🚀 How to Run Python Application Locally or on VPS

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Set your Telegram Bot Token in `.env` or system environment:
```bash
export TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
export ADMIN_ID="8353748526"
export PORT="5000"
```

### 3. Start the Gateway & Bot
```bash
python wave_gateway.py
# or
python app.py
```

---

## ☁️ Deploying to Vercel (Serverless)

The repository includes `vercel.json` and `api/index.py` configured for `@vercel/python`:

1. Install Vercel CLI: `npm i -g vercel`
2. Run deployment:
   ```bash
   vercel
   ```
3. Set Environment Variables in Vercel Dashboard:
   - `TELEGRAM_BOT_TOKEN`
   - `ADMIN_ID`: `8353748526`
   - `WAVE_API_HOST`: `https://api.wavemoney.io:8100`

---

## 📡 API Usage Examples (cURL)

### 1. Request Deposit
```bash
curl -X POST https://your-domain.com/api/request-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "merchant_token": "7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e",
    "domain": "asiagaming.com"
  }'
```

### 2. Verify Deposit
```bash
curl -X POST https://your-domain.com/api/verify-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "auth_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

### 3. Request Withdrawal
```bash
curl -X POST https://your-domain.com/api/request-withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25000,
    "phone": "09798765432",
    "merchant_token": "7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e"
  }'
```

### 4. Confirm Withdrawal
```bash
curl -X POST https://your-domain.com/api/confirm-withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "withdraw_token": "wd_0123456789abcdef0123456789abcdef",
    "receiver": "09798765432"
  }'
```
