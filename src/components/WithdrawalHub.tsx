import React, { useState, useEffect } from 'react';
import { ArrowDownRight, Clock, CheckCircle2, AlertCircle, RefreshCw, Smartphone, DollarSign, Building } from 'lucide-react';
import { Merchant, WaveAccount } from '../types';

interface WithdrawalHubProps {
  merchants: Merchant[];
  accounts: WaveAccount[];
  onRefresh: () => void;
}

export const WithdrawalHub: React.FC<WithdrawalHubProps> = ({
  merchants,
  accounts,
  onRefresh,
}) => {
  const [selectedToken, setSelectedToken] = useState(merchants[0]?.token || '');
  const [phone, setPhone] = useState('09798765432');
  const [amount, setAmount] = useState('30000');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active withdrawal session
  const [withdrawSession, setWithdrawSession] = useState<{
    withdraw_token: string;
    amount: number;
    phone: string;
    expires_at: number;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<{
    status: string;
    amount: number;
    receiver: string;
    disbursed_from: string;
    trx_id?: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedToken && merchants.length > 0) {
      setSelectedToken(merchants[0].token);
    }
  }, [merchants, selectedToken]);

  // 5-minute countdown timer
  useEffect(() => {
    if (!withdrawSession) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((withdrawSession.expires_at - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [withdrawSession]);

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setConfirmationResult(null);

    try {
      const res = await fetch('/api/request-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          phone: phone.trim(),
          merchant_token: selectedToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const expiresAt = Date.now() + (data.expires_in_seconds || 300) * 1000;
        setWithdrawSession({
          withdraw_token: data.withdraw_token,
          amount: data.amount,
          phone: phone.trim(),
          expires_at: expiresAt,
        });
        setTimeLeft(data.expires_in_seconds || 300);
      } else {
        setErrorMsg(data.message || 'Withdrawal authorization failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawSession) return;
    setIsConfirming(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/confirm-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdraw_token: withdrawSession.withdraw_token,
          receiver: withdrawSession.phone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setConfirmationResult(data);
        onRefresh();
      } else {
        setErrorMsg(data.message || 'Disbursement execution failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution error');
    } finally {
      setIsConfirming(false);
    }
  };

  const highestAccount = [...accounts]
    .filter((a) => a.wmt_mfs)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))[0];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Automated Merchant Withdrawal Hub
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Disburse winnings or refunds to customer Wave accounts. The system automatically inspects your active accounts pool and routes the transfer through the account with the highest balance.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pool Balance Glance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Total Pool Liquidity</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
            {accounts.reduce((sum, a) => sum + (a.balance || 0), 0).toLocaleString()} Ks
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Building className="w-4 h-4 text-amber-400" />
            <span>Highest Balance Account</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 tabular-nums truncate">
            {highestAccount ? `${(highestAccount.balance || 0).toLocaleString()} Ks` : '0 Ks'}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            {highestAccount ? `MSISDN: 0${highestAccount.phone}` : 'No active account'}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Token Security TTL</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
            5 Minutes
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Strict single-use cryptographic expiry
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Request Withdrawal Form */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">
            01. Request Withdrawal Authorization
          </h2>

          <form onSubmit={handleRequestWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Merchant Authenticator
              </label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {merchants.map((m) => (
                  <option key={m.token} value={m.token}>
                    {m.merchant_name} ({m.domain})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Customer Recipient Wave Phone
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09798765432"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Payout Amount (Ks)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedToken}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{isLoading ? 'Authorizing...' : 'Request Withdraw Token (5m)'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Execution & Payout confirmation */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">
              02. Confirm Payout Execution
            </h2>
            {withdrawSession && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <Clock className={`w-3.5 h-3.5 ${timeLeft < 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                <span className={`${timeLeft < 60 ? 'text-rose-400 font-bold' : 'text-slate-300'} tabular-nums`}>
                  Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {!withdrawSession ? (
            <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl">
              <ArrowDownRight className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No Active Withdrawal Token</p>
              <p className="text-xs text-slate-600 mt-1">
                Authorize a withdrawal request on the left to generate a 5-minute single-use token.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                      Authorized Payout Amount
                    </span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                      {withdrawSession.amount.toLocaleString()} Ks
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">
                      Target Receiver
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-200">
                      {withdrawSession.phone}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-mono bg-slate-900/70 p-3 rounded-lg border border-slate-800 text-slate-300 space-y-1">
                  <div>Withdraw Token: <span className="text-amber-300">{withdrawSession.withdraw_token}</span></div>
                  <div className="text-[11px] text-slate-500">
                    Target account: Automatically selects highest balance Wave account ({highestAccount ? `0${highestAccount.phone} with ${(highestAccount.balance || 0).toLocaleString()} Ks` : 'None'})
                  </div>
                </div>

                <button
                  onClick={handleConfirmWithdraw}
                  disabled={isConfirming || timeLeft <= 0 || confirmationResult !== null}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  {isConfirming ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isConfirming ? 'Executing Wave API Transfer...' : 'Confirm & Execute Transfer'}</span>
                </button>
              </div>

              {confirmationResult && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Disbursement Completed Successfully</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 text-emerald-200 pt-1">
                    <div>Amount: <span className="text-white font-bold">{confirmationResult.amount.toLocaleString()} Ks</span></div>
                    <div>Sent To: <span className="text-white font-bold">{confirmationResult.receiver}</span></div>
                    <div>Disbursed From: <span className="text-white font-bold">0{confirmationResult.disbursed_from}</span></div>
                    {confirmationResult.trx_id && (
                      <div>Trx ID: <span className="text-white font-bold">{confirmationResult.trx_id}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
