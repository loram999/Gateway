import React, { useState, useEffect } from 'react';
import { Copy, Check, Play, RefreshCw, ArrowUpRight } from 'lucide-react';
import { Workspace } from '../types';

export const ApiDocsPage: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null);
  const [selectedLang, setSelectedLang] = useState<'curl' | 'python' | 'node' | 'php'>('curl');
  const [selectedEndpoint, setSelectedEndpoint] = useState<'deposit' | 'verify' | 'withdraw'>('deposit');
  const [copiedCode, setCopiedCode] = useState(false);

  // Live tester state
  const [testAmount, setTestAmount] = useState('50000');
  const [testAuthToken, setTestAuthToken] = useState('');
  const [testLast5, setTestLast5] = useState('');
  const [testReceiver, setTestReceiver] = useState('09798765432');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((d) => {
        if (d.workspaces?.length > 0) {
          setWorkspaces(d.workspaces);
          setSelectedWs(d.workspaces[0]);
        }
      })
      .catch(console.error);
  }, []);

  const apiKey = selectedWs?.api_key || 'wk_wave_live_your_api_key';

  const copyText = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

    if (selectedEndpoint === 'deposit') {
      if (selectedLang === 'curl') {
        return `curl -X POST "${origin}/api/v1/deposit" \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${apiKey}",
    "amount": 50000,
    "order_id": "ORD-9821"
  }'`;
      }
      if (selectedLang === 'python') {
        return `import requests

url = "${origin}/api/v1/deposit"
payload = {
    "api_key": "${apiKey}",
    "amount": 50000,
    "order_id": "ORD-9821"
}
res = requests.post(url, json=payload)
data = res.json()
print("Wave Phone:", data["phone_number"])
print("Auth Token:", data["auth_token"])`;
      }
      if (selectedLang === 'node') {
        return `const res = await fetch("${origin}/api/v1/deposit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: "${apiKey}",
    amount: 50000,
    order_id: "ORD-9821"
  })
});
const data = await res.json();
console.log("Pay to: 0" + data.phone_number, "Auth Token:", data.auth_token);`;
      }
      return `<?php
$payload = [
  "api_key" => "${apiKey}",
  "amount" => 50000,
  "order_id" => "ORD-9821"
];
$ch = curl_init("${origin}/api/v1/deposit");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
$data = json_decode($res, true);
?>`;
    }

    if (selectedEndpoint === 'verify') {
      if (selectedLang === 'curl') {
        return `curl -X POST "${origin}/api/v1/verify" \\
  -H "Content-Type: application/json" \\
  -d '{
    "auth_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "last5_digits": "09482"
  }'`;
      }
      if (selectedLang === 'python') {
        return `import requests

res = requests.post("${origin}/api/v1/verify", json={
    "auth_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "last5_digits": "09482"
})
print("Result:", res.json())`;
      }
      if (selectedLang === 'node') {
        return `const res = await fetch("${origin}/api/v1/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    auth_token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    last5_digits: "09482"
  })
});
const result = await res.json();
console.log("Confirmed:", result.status === "success");`;
      }
      return `<?php
$payload = [
  "auth_token" => "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "last5_digits" => "09482"
];
$ch = curl_init("${origin}/api/v1/verify");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
$result = json_decode($res, true);
?>`;
    }

    // Withdraw endpoint
    if (selectedLang === 'curl') {
      return `curl -X POST "${origin}/api/v1/withdraw" \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${apiKey}",
    "amount": 25000,
    "receiver_phone": "09798765432"
  }'`;
    }
    if (selectedLang === 'python') {
      return `import requests

res = requests.post("${origin}/api/v1/withdraw", json={
    "api_key": "${apiKey}",
    "amount": 25000,
    "receiver_phone": "09798765432"
})
print("Payout:", res.json())`;
    }
    if (selectedLang === 'node') {
      return `const res = await fetch("${origin}/api/v1/withdraw", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: "${apiKey}",
    amount: 25000,
    receiver_phone: "09798765432"
  })
});
const payout = await res.json();
console.log("Disbursed! Trx ID:", payout.trx_id);`;
    }
    return `<?php
$payload = [
  "api_key" => "${apiKey}",
  "amount" => 25000,
  "receiver_phone" => "09798765432"
];
$ch = curl_init("${origin}/api/v1/withdraw");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
$payout = json_decode($res, true);
?>`;
  };

  const runLiveTest = async () => {
    setTestLoading(true);
    setTestResponse(null);

    try {
      if (selectedEndpoint === 'deposit') {
        const res = await fetch('/api/v1/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            amount: parseFloat(testAmount),
          }),
        });
        const d = await res.json();
        setTestResponse(d);
        if (d.auth_token) setTestAuthToken(d.auth_token);
      } else if (selectedEndpoint === 'verify') {
        const res = await fetch('/api/v1/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_token: testAuthToken || 'a1b2c3d4-test-token',
            last5_digits: testLast5 || '09482',
          }),
        });
        setTestResponse(await res.json());
      } else {
        const res = await fetch('/api/v1/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            amount: parseFloat(testAmount),
            receiver_phone: testReceiver,
          }),
        });
        setTestResponse(await res.json());
      }
    } catch (err: any) {
      setTestResponse({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            API Documents (စာရွက်စာတမ်း)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Auto-Deposit (ငွေသွင်း) နှင့် Auto-Withdraw (ငွေထုတ်) ချိတ်ဆက်ရန် REST API
          </p>
        </div>

        {workspaces.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500">API Key:</span>
            <code className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-white font-bold truncate max-w-[160px] sm:max-w-[200px]">
              {selectedWs?.api_key || apiKey}
            </code>
          </div>
        )}
      </div>

      {/* 3 Steps Overview Cards (Monochrome) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
          <div className="text-[10px] font-mono text-zinc-400 font-bold uppercase">1. Auto-Deposit</div>
          <div className="text-xs font-bold text-white">POST /api/v1/deposit</div>
          <p className="text-xs text-zinc-400">
            ပမာဏပို့ပြီး သွင်းရမည့် Wave ဖုန်းနံပါတ်နှင့် auth_token ရယူပါ။
          </p>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
          <div className="text-[10px] font-mono text-zinc-400 font-bold uppercase">2. Auto-Verify</div>
          <div className="text-xs font-bold text-white">POST /api/v1/verify</div>
          <p className="text-xs text-zinc-400">
            Customer ထည့်လိုက်သော Transaction ID နောက်ဆုံး ၅ လုံးဖြင့် အလိုအလျောက် အတည်ပြုပါ။
          </p>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
          <div className="text-[10px] font-mono text-zinc-400 font-bold uppercase">3. Auto-Withdraw</div>
          <div className="text-xs font-bold text-white">POST /api/v1/withdraw</div>
          <p className="text-xs text-zinc-400">
            လက်ခံမည့်ဖုန်းနှင့် ပမာဏပို့ရုံဖြင့် Stored PIN ဖြင့် Auto လွှဲပေးပါသည်။
          </p>
        </div>
      </div>

      {/* Code Console */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
        {/* Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'deposit', label: 'POST /api/v1/deposit' },
              { id: 'verify', label: 'POST /api/v1/verify' },
              { id: 'withdraw', label: 'POST /api/v1/withdraw' },
            ].map((ep) => (
              <button
                key={ep.id}
                onClick={() => setSelectedEndpoint(ep.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  selectedEndpoint === ep.id
                    ? 'bg-white text-black font-semibold'
                    : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {ep.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-zinc-800 text-xs font-mono self-start sm:self-center">
            {(['curl', 'python', 'node', 'php'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-2 py-0.5 rounded cursor-pointer uppercase transition-colors ${
                  selectedLang === lang ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative">
          <pre className="p-4 bg-black rounded-lg text-xs font-mono text-zinc-200 overflow-x-auto border border-zinc-800 leading-relaxed max-w-full">
            {getSnippet()}
          </pre>
          <button
            onClick={() => copyText(getSnippet())}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-mono text-white cursor-pointer transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Live Test Sandbox */}
        <div className="pt-3 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              <span>Live Test (ချက်ချင်းစမ်းသပ်ရန်)</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">Live Backend</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedEndpoint === 'deposit' && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Deposit Amount (Ks) *</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>
            )}

            {selectedEndpoint === 'verify' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Auth Token *</label>
                  <input
                    type="text"
                    value={testAuthToken}
                    onChange={(e) => setTestAuthToken(e.target.value)}
                    placeholder="Auth Token"
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Trx ID Last 5 Digits *</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={testLast5}
                    onChange={(e) => setTestLast5(e.target.value)}
                    placeholder="09482"
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white"
                  />
                </div>
              </>
            )}

            {selectedEndpoint === 'withdraw' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Withdraw Amount (Ks) *</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Receiver Wave Phone *</label>
                  <input
                    type="text"
                    value={testReceiver}
                    onChange={(e) => setTestReceiver(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={runLiveTest}
                disabled={testLoading}
                className="w-full py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                {testLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>စမ်းသပ်မည် (Execute)</span>
              </button>
            </div>
          </div>

          {testResponse && (
            <div className="p-3 bg-black rounded-lg border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                Response:
              </span>
              <pre className="text-xs font-mono text-zinc-200 overflow-x-auto max-w-full">
                {JSON.stringify(testResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
