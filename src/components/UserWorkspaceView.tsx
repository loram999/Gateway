import React, { useState, useEffect } from 'react';
import { Smartphone, Plus, Key, RefreshCw, Copy, Check, ArrowRightLeft, History, Shield, Zap, Sparkles, Building2, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Workspace, WaveAccount, TransactionHistoryItem } from '../types';

interface UserWorkspaceViewProps {
  onNavigateToApiDocs?: () => void;
  onRefreshGlobal?: () => void;
}

export const UserWorkspaceView: React.FC<UserWorkspaceViewProps> = ({
  onNavigateToApiDocs,
  onRefreshGlobal,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [accounts, setAccounts] = useState<WaveAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Create Workspace Form
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [wsCreating, setWsCreating] = useState(false);

  // Add Wave Account Form
  const [phone, setPhone] = useState('');
  const [model, setModel] = useState('Pixel 7 Pro');
  const [osVersion, setOsVersion] = useState('14');
  const [pin, setPin] = useState('');
  const [simLabel, setSimLabel] = useState('');
  const [isAddingSim, setIsAddingSim] = useState(false);
  const [simAddMsg, setSimAddMsg] = useState<string | null>(null);

  // Login Modal
  const [loginPhone, setLoginPhone] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'otp' | 'pin'>('otp');
  const [otpValue, setOtpValue] = useState('');
  const [loginPinValue, setLoginPinValue] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // History Modal
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<TransactionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Manual Transfer Modal (Auto uses stored PIN!)
  const [transferSender, setTransferSender] = useState<string | null>(null);
  const [transferReceiver, setTransferReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('10000');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<string | null>(null);

  // Load workspaces
  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setWorkspaces(data.workspaces || []);
        if (!selectedWorkspace && data.workspaces.length > 0) {
          setSelectedWorkspace(data.workspaces[0]);
          loadWorkspaceAccounts(data.workspaces[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkspaceAccounts = async (wsId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${wsId}/accounts`);
      const data = await res.json();
      if (res.ok) {
        setAccounts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleSelectWorkspace = (ws: Workspace) => {
    setSelectedWorkspace(ws);
    loadWorkspaceAccounts(ws.id);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    setWsCreating(true);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wsName.trim(),
          owner_name: ownerName.trim() || 'User',
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setWsName('');
        setOwnerName('');
        setShowCreateWs(false);
        fetchWorkspaces();
        setSelectedWorkspace(data.workspace);
        loadWorkspaceAccounts(data.workspace.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWsCreating(false);
    }
  };

  const handleAddSim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !selectedWorkspace) return;
    setIsAddingSim(true);
    setSimAddMsg(null);

    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace.id}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          model: model.trim(),
          os_version: osVersion.trim(),
          pin: pin.trim(),
          name: simLabel.trim() || `Wave SIM 0${phone.trim()}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPhone('');
        setPin('');
        setSimLabel('');
        setSimAddMsg(`Wave SIM 0${data.phone} added to your workspace. Please login to activate.`);
        loadWorkspaceAccounts(selectedWorkspace.id);
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        setSimAddMsg(`Failed: ${data.message || 'Error'}`);
      }
    } catch (err: any) {
      setSimAddMsg(`Error: ${err.message}`);
    } finally {
      setIsAddingSim(false);
    }
  };

  const startLogin = async (p: string) => {
    setLoginPhone(p);
    setLoginStep('otp');
    setOtpValue('');
    setLoginPinValue('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/accounts/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p }),
      });
      const data = await res.json();
      if (res.ok && data.debug_otp) {
        setOtpValue(data.debug_otp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  const completeLogin = async () => {
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
        if (selectedWorkspace) loadWorkspaceAccounts(selectedWorkspace.id);
        if (onRefreshGlobal) onRefreshGlobal();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  const executeTransfer = async () => {
    if (!transferSender || !transferReceiver || !transferAmount) return;
    setTransferLoading(true);
    setTransferResult(null);

    try {
      const res = await fetch('/api/accounts/transfer', {
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
        if (selectedWorkspace) loadWorkspaceAccounts(selectedWorkspace.id);
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        setTransferResult(`Failed: ${data.message}`);
      }
    } catch (err: any) {
      setTransferResult(`Error: ${err.message}`);
    } finally {
      setTransferLoading(false);
    }
  };

  const viewHistory = async (p: string) => {
    setHistoryPhone(p);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/accounts/${p}/history?limit=10`);
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

  const copyApiKey = () => {
    if (!selectedWorkspace) return;
    navigator.clipboard.writeText(selectedWorkspace.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const totalWorkspaceBal = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const activeCount = accounts.filter((a) => a.wmt_mfs).length;

  return (
    <div className="space-y-8">
      {/* Title & Workspace Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
              User Workspace Portal
            </span>
            <span className="text-xs font-mono text-slate-400">
              No Merchant Application Needed
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            {selectedWorkspace?.name || 'My Personal Workspace'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Add your Wave Money SIM accounts here. They are immediately integrated into your personal Workspace API for Automated Deposits (Last-5 Digits) & Automated Withdrawals!
          </p>
        </div>

        {/* Workspace Switcher & New Workspace Button */}
        <div className="flex items-center gap-2">
          <select
            value={selectedWorkspace?.id || ''}
            onChange={(e) => {
              const ws = workspaces.find((w) => w.id === e.target.value);
              if (ws) handleSelectWorkspace(ws);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.owner_name || 'User'})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateWs(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Workspace</span>
          </button>
        </div>
      </div>

      {/* Workspace API Key & Auto-Gateway Integration Bar */}
      {selectedWorkspace && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
                Workspace API Key (Use this in your website / scripts for Auto Deposit & Withdraw)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-amber-300 font-mono text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 truncate max-w-[280px] sm:max-w-[420px]">
                  {selectedWorkspace.api_key}
                </code>
                <button
                  onClick={copyApiKey}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToApiDocs && (
                <button
                  onClick={onNavigateToApiDocs}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>View API Documents & SDKs</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block">Workspace Balance</span>
              <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                {totalWorkspaceBal.toLocaleString()} Ks
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block">Connected Wave SIMs</span>
              <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                {activeCount} Active / {accounts.length} Total
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block">API Features Ready</span>
              <span className="text-xs font-mono text-amber-300 font-semibold block mt-1">
                Auto-Deposit (Last-5 Digits) + Auto-Withdraw (Auto-PIN)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* New Workspace Modal */}
      {showCreateWs && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">Create New Personal Workspace</h3>
            </div>
            <p className="text-xs text-slate-400">
              Create an isolated workspace with its own dedicated API Key and Wave SIM pool for your website or business.
            </p>

            <form onSubmit={handleCreateWorkspace} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. My Casino Store, Topup Hub, Personal Wallet"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Owner / Project Label
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ko Phyo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={wsCreating}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {wsCreating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Workspace & API Key</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateWs(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wave Accounts Add Page & SIMs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Wave အကောင့် Add Page */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Wave အကောင့် Add Page
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Add your Wave Money account. Storing your PIN securely enables the API to perform Auto Withdrawals without manual prompt.
          </p>

          {simAddMsg && (
            <div className="p-3 text-xs bg-slate-950 border border-slate-800 text-amber-300 rounded-xl">
              {simAddMsg}
            </div>
          )}

          <form onSubmit={handleAddSim} className="space-y-3">
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
                SIM Name / Account Nickname
              </label>
              <input
                type="text"
                value={simLabel}
                onChange={(e) => setSimLabel(e.target.value)}
                placeholder="e.g. Deposit Receiving SIM"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Device Model
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Pixel 7 Pro"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Android OS
                </label>
                <input
                  type="text"
                  required
                  value={osVersion}
                  onChange={(e) => setOsVersion(e.target.value)}
                  placeholder="14"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                6-Digit Wave PIN (Auto-used for API transfers)
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
              disabled={isAddingSim}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors mt-2"
            >
              {isAddingSim ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Add Wave Account to Workspace</span>
            </button>
          </form>
        </div>

        {/* Right Column: Connected Wave Accounts in this Workspace */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Workspace Wave Accounts ({accounts.length})
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Ready for Auto Deposit & Auto Withdraw via your API Key
              </span>
            </div>

            <button
              onClick={() => selectedWorkspace && loadWorkspaceAccounts(selectedWorkspace.id)}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
              title="Refresh SIM balances"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
              <Smartphone className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="font-semibold text-slate-400">No Wave accounts connected to this workspace yet.</p>
              <p>Add your first Wave SIM on the left to start processing automated payments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => {
                const isLoggedIn = !!acc.wmt_mfs;
                return (
                  <div
                    key={acc.phone}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-mono text-slate-100">
                          0{acc.phone}
                        </span>
                        {isLoggedIn ? (
                          <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Session Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            Needs Login
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-sans">
                        {acc.name || 'Wave Account'} · {acc.model} (Android {acc.os_version})
                      </div>
                      <div className="text-xs font-mono text-amber-400 font-bold tabular-nums">
                        {(acc.balance || 0).toLocaleString()} Ks
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isLoggedIn && (
                        <button
                          onClick={() => startLogin(acc.phone)}
                          className="px-2.5 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                        >
                          Login with OTP
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setTransferSender(acc.phone);
                          setTransferResult(null);
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs cursor-pointer"
                        title="P2P Transfer (Auto uses PIN)"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => viewHistory(acc.phone)}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs cursor-pointer"
                        title="View Wave History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {loginPhone && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-100">Login Wave SIM: 0{loginPhone}</h3>
            {loginStep === 'otp' ? (
              <div className="space-y-3">
                <label className="block text-xs text-slate-400">Enter SMS OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100"
                />
                <button
                  onClick={() => setLoginStep('pin')}
                  className="w-full py-2 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Verify OTP & Enter PIN
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
                  onClick={completeLogin}
                  disabled={loginLoading}
                  className="w-full py-2 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {loginLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Session & Activate Auto-API</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-100">P2P Transfer from 0{transferSender}</h3>
            <p className="text-xs text-slate-400">
              Transfer funds from this SIM. The stored user PIN is used automatically without asking for PIN.
            </p>
            {transferResult && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-emerald-300 font-mono">
                {transferResult}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Recipient Wave Phone</label>
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
                onClick={executeTransfer}
                disabled={transferLoading}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {transferLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Transfer (Auto-PIN)</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">History: 0{historyPhone}</h3>
              <span className="text-xs text-emerald-400 font-mono">Cloudflare Bypass via curl_cffi</span>
            </div>
            {historyLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Scraping Wave transactions...</div>
            ) : historyItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No transactions recorded.</div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {historyItems.map((h, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-bold">Trx ID: {h.transId}</div>
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
