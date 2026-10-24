import React, { useState } from 'react';
import { Terminal, Copy, Check, Code, Download, Server, Cpu, ExternalLink } from 'lucide-react';

export const ApiDocsExport: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'python' | 'node' | 'php'>('curl');
  const [activeEndpoint, setActiveEndpoint] = useState<'deposit_req' | 'deposit_verify' | 'withdraw_req' | 'withdraw_confirm'>('deposit_req');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<'wave_gateway' | 'requirements' | 'vercel' | 'api_index'>('wave_gateway');

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getCodeSnippet = () => {
    if (activeEndpoint === 'deposit_req') {
      if (selectedLanguage === 'curl') {
        return `curl -X POST https://your-gateway.com/api/request-deposit \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "merchant_token": "7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e",
    "domain": "asiagaming.com"
  }'`;
      }
      if (selectedLanguage === 'python') {
        return `import requests

url = "https://your-gateway.com/api/request-deposit"
payload = {
    "amount": 50000,
    "merchant_token": "7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e",
    "domain": "asiagaming.com"
}
response = requests.post(url, json=payload)
data = response.json()
print("Auth Token:", data["auth_token"])
print("Send to Wave Phone:", data["phone_number"])`;
      }
      if (selectedLanguage === 'node') {
        return `const res = await fetch("https://your-gateway.com/api/request-deposit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 50000,
    merchant_token: "7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e",
    domain: "asiagaming.com"
  })
});
const result = await res.json();
console.log("Token:", result.auth_token, "Pay to:", result.phone_number);`;
      }
      if (selectedLanguage === 'php') {
        return `<?php
$data = [
    "amount" => 50000,
    "merchant_token" => "7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e",
    "domain" => "asiagaming.com"
];
$ch = curl_init("https://your-gateway.com/api/request-deposit");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
$result = json_decode($response, true);
?>`;
      }
    }

    if (activeEndpoint === 'deposit_verify') {
      if (selectedLanguage === 'curl') {
        return `curl -X POST https://your-gateway.com/api/verify-deposit \\
  -H "Content-Type: application/json" \\
  -d '{
    "auth_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'`;
      }
      if (selectedLanguage === 'python') {
        return `import requests

res = requests.post("https://your-gateway.com/api/verify-deposit", json={
    "auth_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
})
result = res.json()
if result.get("status") == "success":
    print("Verified! Trx ID:", result["trx_id"])`;
      }
      return `fetch("https://your-gateway.com/api/verify-deposit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ auth_token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
}).then(r => r.json()).then(console.log);`;
    }

    if (activeEndpoint === 'withdraw_req') {
      return `curl -X POST https://your-gateway.com/api/request-withdraw \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 25000,
    "phone": "09798765432",
    "merchant_token": "7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e"
  }'`;
    }

    return `curl -X POST https://your-gateway.com/api/confirm-withdraw \\
  -H "Content-Type: application/json" \\
  -d '{
    "withdraw_token": "wd_0123456789abcdef0123456789abcdef",
    "receiver": "09798765432"
  }'`;
  };

  const getFilePreview = () => {
    if (selectedFile === 'vercel') {
      return `{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.py"
    }
  ]
}`;
    }

    if (selectedFile === 'requirements') {
      return `flask>=3.0.0
python-telegram-bot>=20.8
requests>=2.31.0
curl_cffi>=0.7.0b4
cryptography>=42.0.0
pillow>=10.2.0
pytesseract>=0.3.10
urllib3>=2.0.0`;
    }

    if (selectedFile === 'api_index') {
      return `import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from wave_gateway import flask_app

app = flask_app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)`;
    }

    return `# Wave Money Payment Gateway & Telegram Bot
# Run with: python wave_gateway.py
# (Full self-contained file with WaveWallet, Flask API, curl_cffi Cloudflare bypass, and Telegram bot)
# File located at /wave_gateway.py`;
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          API Specifications & Vercel Deployment Hub
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Everything required to connect merchant storefronts or deploy the Python payment gateway server to Vercel, Docker, or Ubuntu VPS.
        </p>
      </div>

      {/* API Reference & Code Generator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'deposit_req', label: 'POST /api/request-deposit' },
              { id: 'deposit_verify', label: 'POST /api/verify-deposit' },
              { id: 'withdraw_req', label: 'POST /api/request-withdraw' },
              { id: 'withdraw_confirm', label: 'POST /api/confirm-withdraw' },
            ].map((ep) => (
              <button
                key={ep.id}
                onClick={() => setActiveEndpoint(ep.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeEndpoint === ep.id
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {ep.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {(['curl', 'python', 'node', 'php'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2.5 py-1 rounded cursor-pointer uppercase ${
                  selectedLanguage === lang
                    ? 'bg-slate-800 text-amber-300 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative">
          <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800/80 leading-relaxed">
            {getCodeSnippet()}
          </pre>
          <button
            onClick={() => copySnippet(getCodeSnippet())}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Vercel & Source Code Ready Files */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Vercel Serverless & Python Backend Source Files
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'wave_gateway', label: 'wave_gateway.py' },
              { id: 'requirements', label: 'requirements.txt' },
              { id: 'vercel', label: 'vercel.json' },
              { id: 'api_index', label: 'api/index.py' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFile(f.id as any)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  selectedFile === f.id
                    ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80 max-h-72">
            {getFilePreview()}
          </pre>
        </div>

        {/* Deployment Steps Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <span>🚀 Deploy to Vercel (1-Click CLI)</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 font-mono">
              <li>npm i -g vercel</li>
              <li>vercel deploy</li>
              <li>Set TELEGRAM_BOT_TOKEN & ADMIN_ID in dashboard</li>
            </ol>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span>🖥️ Deploy to VPS / Docker (Systemd)</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 font-mono">
              <li>pip install -r requirements.txt</li>
              <li>python3 wave_gateway.py</li>
              <li>Runs Flask on background, Bot on main thread</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
