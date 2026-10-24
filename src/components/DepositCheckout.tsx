import React, { useState, useEffect } from 'react';
import { QrCode, Clock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Copy, Check, FileText } from 'lucide-react';
import { Merchant } from '../types';

interface DepositCheckoutProps {
  merchants: Merchant[];
  defaultToken?: string;
  defaultDomain?: string;
  onDepositVerified?: () => void;
}

export const DepositCheckout: React.FC<DepositCheckoutProps> = ({
  merchants,
  defaultToken,
  defaultDomain,
  onDepositVerified,
}) => {
  const [selectedToken, setSelectedToken] = useState(defaultToken || merchants[0]?.token || '');
  const [domain, setDomain] = useState(defaultDomain || 'localhost');
  const [amount, setAmount] = useState('50000');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active deposit state
  const [activeSession, setActiveSession] = useState<{
    auth_token: string;
    phone_number: string;
    amount: number;
    expires_at: number;
    created_at: number;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [trxIdInput, setTrxIdInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<{
    status: string;
    amount: number;
    trx_id: string;
  } | null>(null);

  // OCR test text with Myanmar digits
  const [ocrText, setOcrText] = useState('WavePay Trx ID: ၂၀၂၆၁၀၂၃၀၉၄၈၂၁ ပမာဏ: ၅၀,၀၀၀ Ks');
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (defaultToken) {
      setSelectedToken(defaultToken);
    }
  }, [defaultToken]);

  // 15-minute countdown timer
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeSession.expires_at - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleRequestDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setVerifiedResult(null);

    try {
      const res = await fetch('/api/request-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          merchant_token: selectedToken,
          domain: domain || 'localhost',
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const expiresAt = Date.now() + (data.expires_in_seconds || 900) * 1000;
        setActiveSession({
          auth_token: data.auth_token,
          phone_number: data.phone_number,
          amount: data.amount,
          expires_at: expiresAt,
          created_at: Date.now(),
        });
        setTimeLeft(data.expires_in_seconds || 900);
      } else {
        setErrorMsg(data.message || 'Deposit request failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const [last5Input, setLast5Input] = useState('');

  const handleVerifyDeposit = async () => {
    if (!activeSession) return;
    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/verify-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: activeSession.auth_token,
          last5_digits: last5Input.trim() || undefined,
          trx_id: trxIdInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setVerifiedResult(data);
        if (onDepositVerified) onDepositVerified();
      } else {
        setErrorMsg(data.message || 'Verification failed. Transaction not found or already used.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOcrTest = async () => {
    try {
      const res = await fetch('/api/ocr/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: ocrText }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setOcrResult(`Normalized: ${data.normalized_text} | Trx ID: ${data.probable_trx_id || 'None'}`);
        if (data.probable_trx_id) {
          setTrxIdInput(data.probable_trx_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const quickAmounts = [10000, 25000, 50000, 100000, 200000];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Deposit Checkout Widget Simulator
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Simulates the external customer payment experience. Requests an auth_token valid for 15 minutes, binds to an active Wave account, and verifies transaction receipt uniqueness.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Initiation */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-slate-200">
            01. External Merchant Checkout Initiation
          </h2>

          <form onSubmit={handleRequestDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Select Merchant & Key
              </label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {merchants.map((m) => (
                  <option key={m.token} value={m.token}>
                    {m.merchant_name} ({m.domain}) - {m.token.slice(0, 8)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Merchant Request Origin / Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. asiagaming.com or localhost"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">
                  Deposit Amount (MMK / Ks)
                </label>
                <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                  {parseInt(amount || '0', 10).toLocaleString()} Ks
                </span>
              </div>
              <input
                type="number"
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className="px-2 py-1 text-[11px] font-mono bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded cursor-pointer transition-colors"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedToken}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>{isLoading ? 'Requesting Deposit...' : 'Call /api/request-deposit'}</span>
            </button>
          </form>

          {/* Quick OCR Test Tool */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Myanmar Digits OCR Normalizer</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Wave Pay receipts contain Myanmar digits (၀၁၂၃၄၅၆၇၈၉). Tests translation into standard digits (0123456789):
            </p>
            <input
              type="text"
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-slate-300"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleOcrTest}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] cursor-pointer"
              >
                Translate & Extract Trx ID
              </button>
              {ocrResult && (
                <span className="text-[11px] font-mono text-emerald-400 truncate max-w-[200px]">
                  {ocrResult}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Payment Screen */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">
              02. Customer Wave Pay Transfer Interface
            </h2>
            {activeSession && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <Clock className={`w-3.5 h-3.5 ${timeLeft < 180 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                <span className={`${timeLeft < 180 ? 'text-rose-400 font-bold' : 'text-slate-300'} tabular-nums`}>
                  Expires in {formatTimer(timeLeft)}
                </span>
              </div>
            )}
          </div>

          {!activeSession ? (
            <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl">
              <QrCode className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No Active Payment Session</p>
              <p className="text-xs text-slate-600 mt-1">
                Initiate a deposit on the left to generate a 15-minute auth_token and Wave Pay account.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Payment Details Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                      Required Deposit Amount
                    </span>
                    <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                      {activeSession.amount.toLocaleString()} Ks
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">
                      Transfer to Wave Pay MSISDN
                    </span>
                    <span className="text-lg font-mono font-bold text-slate-100 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 inline-block mt-0.5">
                      0{activeSession.phone_number}
                    </span>
                  </div>
                </div>

                {/* Auth Token details */}
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="truncate max-w-[280px]">
                    Token: <span className="text-slate-200">{activeSession.auth_token}</span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeSession.auth_token);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Instructions */}
                <div className="text-xs text-slate-400 space-y-1 bg-slate-900/30 p-3 rounded-lg border border-slate-800/40">
                  <p className="font-semibold text-slate-300">Customer Payment Steps:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                    <li>Open WavePay app on your phone.</li>
                    <li>Transfer exactly <strong className="text-amber-300 font-mono">{activeSession.amount.toLocaleString()} Ks</strong> to <strong className="text-slate-200 font-mono">0{activeSession.phone_number}</strong>.</li>
                    <li>Enter the 10-15 digit Transaction ID from your receipt below.</li>
                  </ol>
                </div>
              </div>

              {/* Verification Section */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    03. ငွေသွင်းအတည်ပြုခြင်း (Verify Deposit)
                  </h3>
                  <span className="text-[11px] font-mono text-amber-400">
                    Trx ID နောက်ဆုံး ၅ လုံးဖြင့် စစ်ဆေးခြင်း
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Transaction ID နောက်ဆုံး ၅ လုံး (Last 5 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={last5Input}
                      onChange={(e) => setLast5Input(e.target.value)}
                      placeholder="ဥပမာ - 06148"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      သို့မဟုတ် အပြည့်အစုံ (Full Trx ID)
                    </label>
                    <input
                      type="text"
                      value={trxIdInput}
                      onChange={(e) => setTrxIdInput(e.target.value)}
                      placeholder="ဥပမာ - 20261023006148"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  onClick={handleVerifyDeposit}
                  disabled={isVerifying || timeLeft <= 0 || verifiedResult !== null}
                  className="w-full px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm shadow-emerald-400/20"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isVerifying ? 'History နှင့် တိုက်စစ်နေပါသည်...' : 'History နှင့် တိုက်စစ်ပြီး အတည်ပြုမည်'}</span>
                </button>

                {verifiedResult && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Payment Settled & Verified!</span>
                    </div>
                    <div className="text-xs font-mono grid grid-cols-2 gap-2 text-emerald-200 pt-1">
                      <div>Amount: <span className="text-white font-bold">{verifiedResult.amount.toLocaleString()} Ks</span></div>
                      <div>Trx ID: <span className="text-white font-bold">{verifiedResult.trx_id}</span></div>
                    </div>
                    <p className="text-[11px] text-emerald-400/80">
                      Registered into used_trx.json to guarantee uniqueness against replay.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
