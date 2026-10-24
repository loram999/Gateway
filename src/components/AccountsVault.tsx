import React, { useState } from 'react';
import { Smartphone, Plus, Trash2, Key, History, ArrowRightLeft, ShieldCheck, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { WaveAccount, TransactionHistoryItem } from '../types';

interface AccountsVaultProps {
  accounts: WaveAccount[];
  onRefresh: () => void;
}

export const AccountsVault: React.FC<AccountsVaultProps> = ({
  accounts,
  onRefresh,
}) => {
  // New account form
  const [phone, setPhone] = useState('');
  const [model, setModel] = useState('Pixel 7 Pro');
  const [osVersion, setOsVersion] = useState('14');
  const [pin, setPin] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Login flow modal
  const [loginPhone, setLoginPhone] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'otp' | 'pin'>('otp');
  const [otpValue, setOtpValue] = useState('');
  const [loginPinValue, setLoginPinValue] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMsg, setLoginMsg] = useState<string | null>(null);

  // Manual Transfer modal
  const [transferSender, setTransferSender] = useState<string | null>(null);
  const [transferReceiver, setTransferReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('10000');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<string | null>(null);

  // History modal
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<TransactionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Admin reveal
  const [showAdminData, setShowAdminData] = useState(false);
  const [adminIdInput, setAdminIdInput] = useState('8353748526');

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          model: model.trim(),
          os_version: osVersion.trim(),
          pin: pin.trim(),
        }),
      });

      if (res.ok) {
        setPhone('');
        setPin('');
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.message || 'Error adding account');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAccount = async (targetPhone: string) => {
    if (!confirm(`Are you sure you want to remove account 0${targetPhone}?`)) return;
    try {
      const res = await fetch(`/api/accounts/${targetPhone}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const startLoginFlow = async (targetPhone: string) => {
    setLoginPhone(targetPhone);
    setLoginStep('otp');
    setOtpValue('');
    setLoginPinValue('');
    setLoginMsg(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/accounts/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoginMsg(`OTP requested. For testing, simulation OTP is: ${data.debug_otp || '123456'}`);
      }
    } catch (err: any) {
      setLoginMsg(`Failed to request OTP: ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const completeLoginFlow = async () => {
    if (!loginPhone) return;
    setLoginLoading(true);
    try {
      const res = await fetch('/api/accounts/login-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone,
          pin: loginPinValue || '123456',
          otp: otpValue,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLoginPhone(null);
        onRefresh();
      } else {
        setLoginMsg(data.message || 'Login failed');
      }
    } catch (err: any) {
      setLoginMsg(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const executeManualTransfer = async () => {
    if (!transferSender || !transferReceiver || !transferAmount) return;
    setTransferLoading(true);
    setTransferResult(null);

    try {
      const res = await fetch('/api/accounts/manual-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_phone: transferSender,
          receiver_phone: transferReceiver,
          amount: parseFloat(transferAmount),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTransferResult(`Success! Trx ID: ${data.trx_id}. Remaining: ${data.sender_remaining?.toLocaleString()} Ks`);
        onRefresh();
      } else {
        setTransferResult(`Failed: ${data.message}`);
      }
    } catch (err: any) {
      setTransferResult(`Error: ${err.message}`);
    } finally {
      setTransferLoading(false);
    }
  };

  const viewHistory = async (targetPhone: string) => {
    setHistoryPhone(targetPhone);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/accounts/${targetPhone}/history?limit=10`);
      const data = await res.json();
      if (data.status === 'success') {
        setHistoryItems(data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Wave Money Accounts Pool & Security Vault
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Multi-device pool of Wave Money SIMs used for receiving merchant customer deposits and fulfilling withdrawal disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdminData(!showAdminData)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer"
          >
            {showAdminData ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Admin Data {showAdminData ? 'Visible' : 'Hidden'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Account Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Register New Wave Device</h2>
          </div>

          <form onSubmit={handleAddAccount} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Phone Number (without 0)
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9798765432"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Device Model (Android)
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Pixel 7 Pro or SM-S918B"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Android OS Version
              </label>
              <input
                type="text"
                required
                value={osVersion}
                onChange={(e) => setOsVersion(e.target.value)}
                placeholder="13 or 14"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                6-Digit Wave PIN (Optional now)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Adding Device...' : 'Add Account to Pool'}</span>
            </button>
          </form>
        </div>

        {/* Accounts Pool Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Active SIMs & Balance Ledger ({accounts.length})
            </h2>
            <button
              onClick={onRefresh}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Refresh Accounts"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-medium">MSISDN</th>
                  <th className="py-2.5 px-3 font-medium">Model / OS</th>
                  <th className="py-2.5 px-3 font-medium text-right">Balance</th>
                  <th className="py-2.5 px-3 font-medium">Session Status</th>
                  <th className="py-2.5 px-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {accounts.map((a) => {
                  const isLoggedIn = !!a.wmt_mfs;
                  return (
                    <tr key={a.phone} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200">0{a.phone}</span>
                        {a.name && (
                          <span className="block text-[11px] text-slate-500 font-sans">{a.name}</span>
                        )}
                        {showAdminData && a.pin && (
                          <span className="block text-[10px] text-amber-400">PIN: {a.pin}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400">
                        <div>{a.model}</div>
                        <span className="text-[11px] text-slate-500 font-mono">Android {a.os_version}</span>
                        {showAdminData && a.device_id && (
                          <div className="text-[10px] font-mono text-slate-600 truncate max-w-[120px]">
                            {a.device_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-300 tabular-nums">
                        {(a.balance || 0).toLocaleString()} Ks
                      </td>
                      <td className="py-3 px-3">
                        {isLoggedIn ? (
                          <span className="text-emerald-400 text-[11px] font-sans flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Active Token
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-sans flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                            Logged Out
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          {!isLoggedIn && (
                            <button
                              onClick={() => startLoginFlow(a.phone)}
                              className="px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Key className="w-3 h-3" />
                              <span>Login</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTransferSender(a.phone);
                              setTransferResult(null);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="Manual Transfer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => viewHistory(a.phone)}
                            className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="View History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(a.phone)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Login Flow Modal */}
      {loginPhone && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-semibold text-slate-100">
              Wave Pay Login: 0{loginPhone}
            </h3>

            {loginMsg && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-amber-300 font-mono">
                {loginMsg}
              </div>
            )}

            {loginStep === 'otp' ? (
              <div className="space-y-3">
                <label className="block text-xs text-slate-400">
                  Enter 6-Digit SMS OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100"
                />
                <button
                  onClick={() => setLoginStep('pin')}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Confirm OTP & Enter PIN
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs text-slate-400">
                  Enter 6-Digit Wave Money PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={loginPinValue}
                  onChange={(e) => setLoginPinValue(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100"
                />
                <button
                  onClick={completeLoginFlow}
                  disabled={loginLoading}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {loginLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Complete Login & Save Session</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setLoginPhone(null)}
              className="w-full text-xs text-slate-500 hover:text-slate-300 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual Transfer Modal */}
      {transferSender && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-semibold text-slate-100">
              Manual Transfer from 0{transferSender}
            </h3>

            {transferResult && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-emerald-300 font-mono">
                {transferResult}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Recipient Phone</label>
                <input
                  type="text"
                  value={transferReceiver}
                  onChange={(e) => setTransferReceiver(e.target.value)}
                  placeholder="09971234567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (Ks)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100"
                />
              </div>

              <button
                onClick={executeManualTransfer}
                disabled={transferLoading}
                className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {transferLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Execute Transfer</span>
              </button>
            </div>

            <button
              onClick={() => setTransferSender(null)}
              className="w-full text-xs text-slate-500 hover:text-slate-300 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyPhone && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100">
                Transaction History: 0{historyPhone}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Cloudflare Bypass via curl_cffi
              </span>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Fetching history records...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No recent transactions found.
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {historyItems.map((h, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-semibold">Trx ID: {h.transId}</div>
                      <div className="text-[11px] text-slate-500">{h.time || 'Recent'} · {h.title}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold tabular-nums ${h.direction === 'CR' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {h.direction === 'CR' ? '+' : '-'}{h.amount.toLocaleString()} Ks
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase">{h.direction === 'CR' ? 'Credit' : 'Debit'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setHistoryPhone(null)}
              className="w-full text-xs text-slate-500 hover:text-slate-300 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
