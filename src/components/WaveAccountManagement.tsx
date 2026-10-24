import React, { useState } from 'react';
import { Smartphone, Plus, Trash2, Key, History, ArrowRightLeft, RefreshCw, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { WaveAccount, TransactionHistoryItem } from '../types';

interface WaveAccountManagementProps {
  accounts: WaveAccount[];
  onRefresh: () => void;
}

export const WaveAccountManagement: React.FC<WaveAccountManagementProps> = ({
  accounts,
  onRefresh,
}) => {
  // Add Account form
  const [phone, setPhone] = useState('');
  const [model, setModel] = useState('Pixel 7 Pro');
  const [osVersion, setOsVersion] = useState('14');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Login flow modal
  const [loginPhone, setLoginPhone] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'otp' | 'pin'>('otp');
  const [otpValue, setOtpValue] = useState('');
  const [loginPinValue, setLoginPinValue] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

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

  // Balance adjustment modal
  const [adjustPhone, setAdjustPhone] = useState<string | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Toggle reveal PIN / Device ID
  const [showSensitive, setShowSensitive] = useState(false);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsAdding(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          model: model.trim(),
          os_version: osVersion.trim(),
          pin: pin.trim(),
          name: name.trim() || 'Wave SIM',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPhone('');
        setPin('');
        setName('');
        setStatusMsg(`Device 0${data.phone} added successfully.`);
        onRefresh();
      } else {
        setStatusMsg(`Failed: ${data.message || 'Error'}`);
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
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
    setLoginLoading(true);

    try {
      const res = await fetch('/api/accounts/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = await res.json();
      if (res.ok && data.debug_otp) {
        setOtpValue(data.debug_otp);
      }
    } catch (err: any) {
      console.error(err);
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
        }),
      });

      if (res.ok) {
        setLoginPhone(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
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
        setTransferResult(`Transfer Successful! Trx ID: ${data.trx_id}`);
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

  const handleAdjustBalance = async () => {
    if (!adjustPhone || !newBalanceInput) return;
    setAdjustLoading(true);
    try {
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: adjustPhone, new_balance: parseFloat(newBalanceInput) }),
      });
      if (res.ok) {
        setAdjustPhone(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdjustLoading(false);
    }
  };

  const totalPoolLiquidity = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const activeCount = accounts.filter((a) => a.wmt_mfs).length;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Wave Money SIMs & Device Pool Management
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Live management of all registered Wave Money Android devices, session tokens (`wmt-mfs`), RSA encryption credentials, and automated balance reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer"
          >
            {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>PINs / Keys {showSensitive ? 'Shown' : 'Hidden'}</span>
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh All Balances</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">Total Pool Liquidity</span>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
            {totalPoolLiquidity.toLocaleString()} Ks
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            Distributed across {accounts.length} SIMs
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">Active Online SIMs</span>
          <div className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-1">
            {activeCount} / {accounts.length}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            Valid wmt-mfs session tokens
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">Cloudflare Bypass Status</span>
          <div className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-1">
            curl_cffi Active
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            chrome_android TLS impersonation
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Register New SIM */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
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
                SIM / Account Label
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Primary Deposit Pool SIM"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Android Device Model
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
                6-Digit PIN
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
              <span>{isAdding ? 'Adding...' : 'Add SIM to Gateway Pool'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Devices Pool Table */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Active SIMs & Balance Ledger ({accounts.length})
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Relational Table: accounts (gateway.db)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-medium">SIM Phone</th>
                  <th className="py-2.5 px-3 font-medium">Hardware Model</th>
                  <th className="py-2.5 px-3 font-medium text-right">Balance</th>
                  <th className="py-2.5 px-3 font-medium">Token State</th>
                  <th className="py-2.5 px-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {accounts.map((a) => {
                  const isLoggedIn = !!a.wmt_mfs;
                  return (
                    <tr key={a.phone} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-100">0{a.phone}</div>
                        <div className="text-[11px] text-slate-500 font-sans">{a.name || 'Wave SIM'}</div>
                        {showSensitive && a.pin && (
                          <div className="text-[10px] text-amber-400">PIN: {a.pin}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400">
                        <div>{a.model}</div>
                        <span className="text-[11px] text-slate-500 font-mono">Android {a.os_version}</span>
                        {showSensitive && a.device_id && (
                          <div className="text-[10px] font-mono text-slate-600 truncate max-w-[120px]">
                            {a.device_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-amber-300 tabular-nums">
                          {(a.balance || 0).toLocaleString()} Ks
                        </div>
                        <button
                          onClick={() => {
                            setAdjustPhone(a.phone);
                            setNewBalanceInput(String(a.balance || 0));
                          }}
                          className="text-[10px] font-sans text-slate-500 hover:text-amber-400 cursor-pointer"
                        >
                          Adjust
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        {isLoggedIn ? (
                          <span className="text-emerald-400 text-[11px] font-sans flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Active Session
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-sans flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                            Needs Login
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 font-sans">
                          {!isLoggedIn && (
                            <button
                              onClick={() => startLoginFlow(a.phone)}
                              className="px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 rounded text-[11px] cursor-pointer"
                            >
                              Login
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTransferSender(a.phone);
                              setTransferResult(null);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                            title="P2P Transfer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => viewHistory(a.phone)}
                            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                            title="Scrape History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(a.phone)}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Delete SIM"
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

      {/* Adjust Balance Modal */}
      {adjustPhone && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Adjust Balance: 0{adjustPhone}</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">New Balance (Ks)</label>
              <input
                type="number"
                value={newBalanceInput}
                onChange={(e) => setNewBalanceInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdjustBalance}
                disabled={adjustLoading}
                className="flex-1 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
              >
                Save Balance
              </button>
              <button
                onClick={() => setAdjustPhone(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Flow Modal */}
      {loginPhone && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-semibold text-slate-100">
              Wave Pay Login: 0{loginPhone}
            </h3>

            {loginStep === 'otp' ? (
              <div className="space-y-3">
                <label className="block text-xs text-slate-400">Enter 6-Digit SMS OTP</label>
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
                <label className="block text-xs text-slate-400">Enter 6-Digit Wave PIN</label>
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
                  <span>Complete Login & Issue wmt-mfs Token</span>
                </button>
              </div>
            )}

            <button onClick={() => setLoginPhone(null)} className="w-full text-xs text-slate-500 hover:text-slate-300 py-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual Transfer Modal */}
      {transferSender && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-semibold text-slate-100">P2P Transfer from 0{transferSender}</h3>
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
            <button onClick={() => setTransferSender(null)} className="w-full text-xs text-slate-500 hover:text-slate-300 py-1">
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
              <h3 className="text-base font-semibold text-slate-100">History: 0{historyPhone}</h3>
              <span className="text-xs text-emerald-400 font-mono">curl_cffi Cloudflare Bypass</span>
            </div>
            {historyLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Scraping transactions...</div>
            ) : historyItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No transactions recorded.</div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {historyItems.map((h, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-semibold">Trx ID: {h.transId}</div>
                      <div className="text-[11px] text-slate-500">{h.time} · {h.title}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold tabular-nums ${h.direction === 'CR' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {h.direction === 'CR' ? '+' : '-'}{h.amount.toLocaleString()} Ks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setHistoryPhone(null)} className="w-full text-xs text-slate-500 hover:text-slate-300 py-1">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
