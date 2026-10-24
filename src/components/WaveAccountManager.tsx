import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Plus, Key, RefreshCw, Copy, Check, ArrowRightLeft, 
  History, Eye, EyeOff, CheckCircle2, AlertCircle, Lock, ArrowUpRight, 
  Trash2, Send, X
} from 'lucide-react';
import { WaveAccount, Workspace, TransactionHistoryItem } from '../types';

interface WaveAccountManagerProps {
  onNavigateToApiDocs: () => void;
  onRefreshGlobal: () => void;
}

export const WaveAccountManager: React.FC<WaveAccountManagerProps> = ({
  onNavigateToApiDocs,
  onRefreshGlobal,
}) => {
  const [accounts, setAccounts] = useState<WaveAccount[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Account form state (User inputs freely!)
  const [phone, setPhone] = useState('');
  const [model, setModel] = useState('SM-S918B');
  const [osVersion, setOsVersion] = useState('14');
  const [pin, setPin] = useState('');
  const [simName, setSimName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Delete Account confirmation modal (In-app, no window.confirm!)
  const [accountToDelete, setAccountToDelete] = useState<WaveAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Login Modal state (OTP + PIN)
  const [loginPhone, setLoginPhone] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [loginPinValue, setLoginPinValue] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // History Modal state
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<TransactionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Manual Transfer Modal state (Auto uses stored PIN!)
  const [transferSender, setTransferSender] = useState<string | null>(null);
  const [transferReceiver, setTransferReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('20000');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<string | null>(null);

  // Balance syncing state
  const [syncingPhone, setSyncingPhone] = useState<string | null>(null);

  // Fetch accounts and default workspace
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accRes, wsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/workspaces'),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(Array.isArray(accData) ? accData : (accData?.accounts || []));
      }

      if (wsRes.ok) {
        const wsData = await wsRes.json();
        if (wsData.workspaces && wsData.workspaces.length > 0) {
          setWorkspace(wsData.workspaces[0]);
        }
      }
    } catch (err: any) {
      console.error('Error loading account data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const copyApiKey = () => {
    if (!workspace?.api_key) return;
    navigator.clipboard.writeText(workspace.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Add Account handler
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/^0/, '');
    if (!cleanPhone) {
      setFeedbackMsg({ type: 'error', text: 'ဖုန်းနံပါတ် ထည့်သွင်းပေးပါ' });
      return;
    }

    setIsAdding(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          model: model.trim() || 'SM-S918B',
          os_version: osVersion.trim() || '14',
          pin: pin.trim(),
          name: simName.trim() || `Wave SIM 0${cleanPhone}`,
          workspace_id: workspace?.id || 'default',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPhone('');
        setPin('');
        setSimName('');
        setShowAddForm(false);
        setFeedbackMsg({
          type: 'success',
          text: `Wave SIM 0${cleanPhone} ထည့်သွင်းပြီးပါပြီ။ OTP Login ဝင်နိုင်ပါပြီ။`,
        });
        loadData();
        onRefreshGlobal();
      } else {
        setFeedbackMsg({
          type: 'error',
          text: data.message || 'အကောင့်ထည့်သွင်းရာတွင် အမှားဖြစ်ပွားပါသည်',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsAdding(false);
    }
  };

  // Delete Account confirmation & execution (NO native window.confirm)
  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    const targetPhone = accountToDelete.phone;
    setDeleteLoading(true);

    try {
      // Optimistic removal for instant UI feedback
      setAccounts((prev) => prev.filter((a) => a.phone !== targetPhone));

      const res = await fetch(`/api/accounts/${targetPhone}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: `Wave အကောင့် 0${targetPhone} ဖျက်ပြီးပါပြီ` });
        setAccountToDelete(null);
        loadData();
        onRefreshGlobal();
      } else {
        setFeedbackMsg({ type: 'error', text: data?.message || 'အကောင့်ဖျက်၍မရပါ' });
        loadData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
      loadData();
    } finally {
      setDeleteLoading(false);
    }
  };

  // Sync Wave API Balance
  const syncBalance = async (targetPhone: string) => {
    setSyncingPhone(targetPhone);
    try {
      const res = await fetch(`/api/accounts/${targetPhone}/sync`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAccounts((prev) =>
          prev.map((a) => (a.phone === targetPhone ? { ...a, balance: data.balance } : a))
        );
        setFeedbackMsg({
          type: 'success',
          text: `0${targetPhone} လက်ကျန်ငွေ: ${(data.balance || 0).toLocaleString()} Ks (Synced)`,
        });
        onRefreshGlobal();
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'ငွေလက်ကျန်စစ်ဆေးမရပါ' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setSyncingPhone(null);
    }
  };

  // Start OTP Login Flow (Wave Money API sends real SMS to user phone)
  const startLoginFlow = async (targetPhone: string) => {
    setLoginPhone(targetPhone);
    setOtpValue(''); // User must type the OTP received via SMS on their phone!
    const existingAcc = accounts.find((a) => a.phone === targetPhone);
    setLoginPinValue(existingAcc?.pin || '');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/accounts/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setFeedbackMsg({
          type: 'success',
          text: `Wave Pay မှ 0${targetPhone} သို့ SMS OTP ပို့ပြီးပါပြီ။ ဖုန်းထဲရောက်လာသော ၆ လုံးပါ OTP ကို ရိုက်ထည့်ပါ။`,
        });
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'OTP တောင်းဆို၍မရပါ' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setLoginLoading(false);
    }
  };

  // Confirm OTP Login Flow
  const completeLoginFlow = async () => {
    if (!loginPhone || !otpValue) return;

    setLoginLoading(true);
    try {
      const res = await fetch('/api/accounts/login-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone,
          otp: otpValue,
          pin: loginPinValue || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLoginPhone(null);
        setFeedbackMsg({
          type: 'success',
          text: `Wave SIM 0${loginPhone} Login အောင်မြင်ပါသည်။ wmt-mfs Session ရရှိပြီးပါပြီ။`,
        });
        loadData();
        onRefreshGlobal();
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Login မအောင်မြင်ပါ' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setLoginLoading(false);
    }
  };

  // View Transaction History
  const viewHistory = async (targetPhone: string) => {
    setHistoryPhone(targetPhone);
    setHistoryLoading(true);
    setHistoryItems([]);

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

  // Execute P2P Transfer (Auto uses user's stored PIN!)
  const executeTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (res.ok && data.status === 'success') {
        setTransferResult(
          `ငွေလွှဲအောင်မြင်ပါသည်! Trx ID: ${data.trx_id}. လက်ကျန်: ${data.sender_remaining?.toLocaleString()} Ks`
        );
        loadData();
        onRefreshGlobal();
      } else {
        setTransferResult(`မအောင်မြင်ပါ: ${data.message || 'ငွေလွှဲရာတွင် အမှားဖြစ်ပွားပါသည်'}`);
      }
    } catch (err: any) {
      setTransferResult(`အမှား: ${err.message}`);
    } finally {
      setTransferLoading(false);
    }
  };

  const totalPoolBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const activeCount = accounts.filter((a) => a.wmt_mfs && a.wmt_mfs.trim() !== '').length;

  return (
    <div className="space-y-6 max-w-full text-white">
      {/* Top Header & Workspace API Key - Pure Monochrome */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Wave အကောင့်များ
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Wave SIM များ ထည့်သွင်းခြင်း၊ OTP ဝင်ရောက်ခြင်းနှင့် Auto-Deposit/Withdraw စီမံမှု
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'ပိတ်မည်' : 'Wave အကောင့် Add'}</span>
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors border border-zinc-700 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors border border-zinc-800 flex items-center gap-1.5"
            >
              {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showSensitive ? 'Hide PIN' : 'Show PIN'}</span>
            </button>
          </div>
        </div>

        {/* API Key Bar */}
        {workspace && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black p-3 rounded-lg border border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-zinc-400 shrink-0">
                Workspace API Key:
              </span>
              <code className="text-white font-mono text-xs truncate bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800 max-w-xs sm:max-w-md">
                {workspace.api_key}
              </code>
              <button
                onClick={copyApiKey}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-mono flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              onClick={onNavigateToApiDocs}
              className="text-xs text-white hover:underline flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-center"
            >
              <span>API Documents</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2 Simple Stats */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-black p-3 rounded-lg border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase font-mono block">စုစုပေါင်း လက်ကျန်ငွေ</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums">
              {totalPoolBalance.toLocaleString()} Ks
            </span>
          </div>
          <div className="bg-black p-3 rounded-lg border border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase font-mono block">အကောင့် အရေအတွက်</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums">
              {activeCount} Active <span className="text-xs font-normal text-zinc-500">/ {accounts.length} Total</span>
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className={`p-3 text-xs rounded-lg flex items-center justify-between border ${
          feedbackMsg.type === 'success' 
            ? 'bg-zinc-900 border-zinc-700 text-white' 
            : 'bg-zinc-950 border-zinc-700 text-zinc-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-white" /> : <AlertCircle className="w-4 h-4 shrink-0 text-zinc-400" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-zinc-400 hover:text-white cursor-pointer ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Add Wave Account Form (Simple direct text inputs!) */}
      {showAddForm && (
        <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>Wave အကောင့် အသစ်ထည့်မည်</span>
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              ✕ ပိတ်မည်
            </button>
          </div>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  ဖုန်းနံပါတ် (Phone Number) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-mono">09</span>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/^09?/, ''))}
                    placeholder="798765432"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  အကောင့် အမည် (Label)
                </label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="SIM 1"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Wave PIN (6-Digit) *
                </label>
                <div className="relative">
                  <input
                    type={showSensitive ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-white"
                  />
                  <Lock className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Device Model (မိမိစိတ်ကြိုက် ရိုက်ထည့်နိုင်သည်) *
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. SM-S918B သို့မဟုတ် Pixel 7 Pro"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Android OS Version (မိမိစိတ်ကြိုက် ရိုက်ထည့်နိုင်သည်) *
                </label>
                <input
                  type="text"
                  required
                  value={osVersion}
                  onChange={(e) => setOsVersion(e.target.value)}
                  placeholder="e.g. 14 သို့မဟုတ် 13"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAdding ? 'ထည့်သွင်းနေပါသည်...' : 'အကောင့် သိမ်းဆည်းမည်'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Account Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span>ချိတ်ဆက်ထားသော Wave အကောင့်များ ({accounts.length})</span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {activeCount} Active
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <Smartphone className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">Wave SIM အကောင့် မရှိသေးပါ</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              အပေါ်ရှိ "Wave အကောင့် Add" ခလုတ်ကိုနှိပ်၍ Wave Pay အကောင့် ထည့်သွင်းပါ။
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Wave အကောင့် Add မည်</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((acc) => {
              const isActive = acc.wmt_mfs && acc.wmt_mfs.trim() !== '';
              const isSyncing = syncingPhone === acc.phone;

              return (
                <div
                  key={acc.phone}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-colors"
                >
                  {/* Top info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate max-w-[160px]">
                        {acc.name || `Wave SIM 0${acc.phone}`}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isActive
                          ? 'border-zinc-600 text-white bg-zinc-900'
                          : 'border-zinc-800 text-zinc-400 bg-black'
                      }`}>
                        {isActive ? '● Active' : '○ Needs Login'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-base font-bold text-white tracking-wide">
                        0{acc.phone}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        {acc.model} (OS {acc.os_version})
                      </span>
                    </div>

                    {/* Balance */}
                    <div className="bg-black p-2.5 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase">လက်ကျန်ငွေ</span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-mono text-white tabular-nums">
                          {(acc.balance || 0).toLocaleString()} Ks
                        </span>
                        <button
                          onClick={() => syncBalance(acc.phone)}
                          disabled={isSyncing}
                          title="Sync Balance with Wave API"
                          className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {showSensitive && (
                      <div className="p-2 bg-black rounded border border-zinc-800 text-[11px] font-mono space-y-1 text-zinc-400">
                        <div className="flex justify-between">
                          <span>PIN:</span>
                          <span className="text-white font-bold">{acc.pin || 'None'}</span>
                        </div>
                        <div className="truncate">
                          <span>Token: </span>
                          <span className="text-zinc-500">{acc.wmt_mfs ? acc.wmt_mfs.slice(0, 16) + '...' : 'None'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => startLoginFlow(acc.phone)}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-800"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Re-Login' : 'OTP Login'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setTransferSender(acc.phone);
                        setTransferReceiver('');
                        setTransferAmount('20000');
                        setTransferResult(null);
                      }}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-800"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>ငွေလွှဲမည်</span>
                    </button>

                    <button
                      onClick={() => viewHistory(acc.phone)}
                      className="px-2.5 py-1.5 bg-black hover:bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>ရာဇဝင်</span>
                    </button>

                    <button
                      onClick={() => setAccountToDelete(acc)}
                      className="px-2.5 py-1.5 bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ဖျက်မည်</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (In-App, Reliable) */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-zinc-400" />
                <span>အကောင့် ဖျက်ရန် အတည်ပြုခြင်း</span>
              </h3>
              <button
                onClick={() => setAccountToDelete(null)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Wave SIM <span className="font-mono font-bold text-white">0{accountToDelete.phone}</span> ({accountToDelete.name || 'Account'}) ကို ဖျက်ရန် သေချာပါသလား?
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer border border-zinc-800"
              >
                မဖျက်တော့ပါ (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                {deleteLoading ? 'ဖျက်နေပါသည်...' : 'ဖျက်မည် (Confirm)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Flow Modal (OTP + PIN) */}
      {loginPhone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">
                  Wave Login: 0{loginPhone}
                </h3>
              </div>
              <button
                onClick={() => setLoginPhone(null)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Wave Pay မှ ဖုန်းနံပါတ် 0{loginPhone} သို့ SMS ဖြင့် ပို့လိုက်သော ၆ လုံးပါ OTP ကုဒ်ကို ရိုက်ထည့်ပါ။
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-400">
                    SMS ဖြင့် ရောက်လာသော OTP (၆ လုံး) *
                  </label>
                  <button
                    type="button"
                    onClick={() => loginPhone && startLoginFlow(loginPhone)}
                    disabled={loginLoading}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    SMS ပြန်ပို့မည် (Resend)
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="SMS OTP ရိုက်ထည့်ပါ"
                  className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg text-base font-mono text-center tracking-widest text-white focus:outline-none focus:border-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Wave PIN (၆ လုံး) *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={loginPinValue}
                  onChange={(e) => setLoginPinValue(e.target.value)}
                  placeholder="Wave PIN ရိုက်ထည့်ပါ"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-center tracking-widest text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setLoginPhone(null)}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer border border-zinc-800"
                >
                  ပိတ်မည်
                </button>
                <button
                  onClick={completeLoginFlow}
                  disabled={loginLoading}
                  className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  {loginLoading ? 'အတည်ပြုနေသည်...' : 'Confirm Login'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Transfer Modal (Auto uses stored PIN!) */}
      {transferSender && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">
                  ငွေလွှဲမည် (Transfer)
                </h3>
              </div>
              <button
                onClick={() => setTransferSender(null)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-black rounded-lg border border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">ပို့မည့် SIM:</span>
                <span className="font-mono text-white font-bold">0{transferSender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">PIN စနစ်:</span>
                <span className="text-zinc-300 font-mono">Stored PIN အလိုအလျောက် သုံးမည်</span>
              </div>
            </div>

            <form onSubmit={executeTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  လက်ခံမည့် Wave Phone နံပါတ် *
                </label>
                <input
                  type="text"
                  required
                  value={transferReceiver}
                  onChange={(e) => setTransferReceiver(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  ငွေပမာဏ (MMK / Ks) *
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  step="500"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              {transferResult && (
                <div className="p-2.5 rounded-lg text-xs font-mono bg-black border border-zinc-800 text-zinc-300">
                  {transferResult}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTransferSender(null)}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer border border-zinc-800"
                >
                  ပိတ်မည်
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{transferLoading ? 'လွှဲနေပါသည်...' : 'ငွေလွှဲမည်'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyPhone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-md w-full space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">
                  ငွေလွှဲမှတ်တမ်း: 0{historyPhone}
                </h3>
              </div>
              <button
                onClick={() => setHistoryPhone(null)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {historyLoading ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                  Wave Transaction History ရယူနေပါသည်...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                  မှတ်တမ်းမရှိသေးပါ။
                </div>
              ) : (
                historyItems.map((h, i) => (
                  <div key={i} className="p-2.5 bg-black rounded-lg border border-zinc-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-white">
                        Trx: {h.transId} (Last 5: <span className="underline">{h.transId.slice(-5)}</span>)
                      </span>
                      <span className="font-bold text-white">
                        {h.direction === 'CR' ? '+' : '-'}{h.amount.toLocaleString()} Ks
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>{h.title}</span>
                      <span>{h.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setHistoryPhone(null)}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium cursor-pointer border border-zinc-800"
            >
              ပိတ်မည်
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
