import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, LogOut, ArrowUpRight, ArrowDownRight, RefreshCw, Copy, Check, Filter, Search } from 'lucide-react';
import { Merchant, PaymentTokenRecord } from '../types';

interface MerchantDashboardProps {
  onQuickCheckout?: (token: string, domain: string) => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onQuickCheckout }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [activeMerchant, setActiveMerchant] = useState<Merchant | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    stats: {
      total_transactions: number;
      deposits_count: number;
      deposits_success: number;
      deposits_volume: number;
      withdrawals_count: number;
      withdrawals_executed: number;
      withdrawals_volume: number;
    };
    transactions: PaymentTokenRecord[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check saved session in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('wave_merchant_token');
    if (savedToken) {
      loadMerchantData(savedToken);
    }
  }, []);

  const loadMerchantData = async (token: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/merchant/dashboard/${token.trim()}`);
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setActiveMerchant(data.merchant);
        setDashboardData({
          stats: data.stats,
          transactions: data.transactions,
        });
        localStorage.setItem('wave_merchant_token', token.trim());
      } else {
        setErrorMsg(data.message || 'Invalid or revoked merchant token');
        localStorage.removeItem('wave_merchant_token');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load merchant data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    loadMerchantData(tokenInput);
  };

  const handleLogout = () => {
    setActiveMerchant(null);
    setDashboardData(null);
    setTokenInput('');
    localStorage.removeItem('wave_merchant_token');
  };

  const copyToken = () => {
    if (!activeMerchant) return;
    navigator.clipboard.writeText(activeMerchant.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Filter transactions
  const filteredTransactions = (dashboardData?.transactions || []).filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchToken = (tx.auth_token || tx.withdraw_token || '').toLowerCase().includes(q);
      const matchTrx = (tx.trx_id || '').toLowerCase().includes(q);
      const matchPhone = (tx.phone_number || tx.phone || tx.receiver || '').includes(q);
      if (!matchToken && !matchTrx && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Editorial Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Merchant Operations Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Secure self-service dashboard for external websites and merchants. Authenticate with your 32-character hex key to view settled deposits, withdrawal payouts, and account health.
          </p>
        </div>

        {activeMerchant && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-lg flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Login Screen if not authenticated */}
      {!activeMerchant ? (
        <div className="max-w-md mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Merchant Access Login</h2>
            <p className="text-xs text-slate-400">
              Enter your 32-character hex merchant API token to access your transaction records.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Merchant API Token (32-char hex)
              </label>
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Merchant Portal'}</span>
            </button>
          </form>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-400">Demo Merchant Credentials:</div>
            <div className="font-mono text-amber-400/90 truncate cursor-pointer hover:underline" onClick={() => setTokenInput('7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e')}>
              • Asia Gaming Store: 7f8b9e1d2c3a4f5b6e7d8c9a0b1c2d3e
            </div>
            <div className="font-mono text-amber-400/90 truncate cursor-pointer hover:underline" onClick={() => setTokenInput('a1b2c3d4e5f60718293a4b5c6d7e8f90')}>
              • Yangon Digital Hub: a1b2c3d4e5f60718293a4b5c6d7e8f90
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Merchant Dashboard */
        <div className="space-y-6">
          {/* Merchant Profile Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                {activeMerchant.merchant_name.slice(0, 1)}
              </div>
              <div>
                <div className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>{activeMerchant.merchant_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Merchant
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Domain Whitelist: <span className="text-slate-300">{activeMerchant.domain || '*'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-slate-500">Key:</span>
              <span className="text-amber-300 truncate max-w-[200px]">{activeMerchant.token}</span>
              <button onClick={copyToken} className="text-slate-400 hover:text-slate-200 cursor-pointer p-1">
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          {dashboardData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">
                  Total Deposit Volume
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                  {dashboardData.stats.deposits_volume.toLocaleString()} Ks
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {dashboardData.stats.deposits_success} Settled / {dashboardData.stats.deposits_count} Requests
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">
                  Total Withdrawal Volume
                </span>
                <div className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-1">
                  {dashboardData.stats.withdrawals_volume.toLocaleString()} Ks
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {dashboardData.stats.withdrawals_executed} Disbursed / {dashboardData.stats.withdrawals_count} Authorized
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">
                  Success Rate
                </span>
                <div className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-1">
                  {dashboardData.stats.total_transactions > 0
                    ? Math.round(
                        ((dashboardData.stats.deposits_success + dashboardData.stats.withdrawals_executed) /
                          dashboardData.stats.total_transactions) *
                          100
                      )
                    : 100}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {dashboardData.stats.total_transactions} Total Transactions
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">
                  Account Status
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                  Healthy
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Webhook / API Active
                </div>
              </div>
            </div>
          )}

          {/* Transaction Ledger Table with Search & Filters */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-200">Transaction History Ledger</h3>
                <span className="text-xs font-mono text-slate-500">
                  ({filteredTransactions.length} items)
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded cursor-pointer ${filterType === 'all' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('deposit')}
                    className={`px-3 py-1 rounded cursor-pointer ${filterType === 'deposit' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Deposits
                  </button>
                  <button
                    onClick={() => setFilterType('withdraw')}
                    className={`px-3 py-1 rounded cursor-pointer ${filterType === 'withdraw' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Withdrawals
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, phone..."
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No transaction records match the current filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3 font-medium">Type</th>
                      <th className="py-2.5 px-3 font-medium">Token / Trx ID</th>
                      <th className="py-2.5 px-3 font-medium">Customer Phone</th>
                      <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 text-right font-medium">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {filteredTransactions.map((tx) => {
                      const isDeposit = tx.type === 'deposit';
                      const isSuccess = tx.status === 'success' || tx.status === 'executed';
                      return (
                        <tr key={tx.auth_token || tx.withdraw_token || Math.random().toString()} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 font-sans text-[11px] font-semibold ${
                                isDeposit ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {isDeposit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              <span>{isDeposit ? 'Deposit' : 'Withdrawal'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-200 truncate max-w-[140px]">
                              {tx.trx_id ? `Trx: ${tx.trx_id}` : (tx.auth_token || tx.withdraw_token)?.slice(0, 16) + '...'}
                            </div>
                            {tx.last5_digits && (
                              <div className="text-[10px] text-amber-400">Last 5: {tx.last5_digits}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            0{tx.phone_number || tx.phone || tx.receiver}
                          </td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-100">
                            {tx.amount.toLocaleString()} Ks
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[11px] font-sans px-2 py-0.5 rounded ${
                                isSuccess
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : tx.status === 'pending' || tx.status === 'authorized'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-[11px] text-slate-500 font-sans">
                            {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
