import React, { useState } from 'react';
import { KeyRound, Plus, Copy, Check, Trash2, Globe, Shield, Terminal } from 'lucide-react';
import { Merchant } from '../types';

interface MerchantPortalProps {
  merchants: Merchant[];
  onRefresh: () => void;
  onSelectForCheckout: (token: string, domain: string) => void;
}

export const MerchantPortal: React.FC<MerchantPortalProps> = ({
  merchants,
  onRefresh,
  onSelectForCheckout,
}) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_name: name.trim(),
          domain: domain.trim() || '*',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setName('');
        setDomain('');
        setStatusMessage(`Merchant ${data.merchant.merchant_name} created with 32-char hex key.`);
        onRefresh();
      } else {
        setStatusMessage(`Failed: ${data.message || 'Error creating merchant'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (token: string) => {
    if (!confirm('Are you sure you want to revoke this merchant token?')) return;
    try {
      const res = await fetch(`/api/merchants/${token}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Merchant Access & 32-Char Hex Tokens
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            External merchant websites authorize deposit and withdrawal requests using these 32-character hex tokens. Domain whitelisting blocks unauthorized referrers.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 tabular-nums">
          Storage: merchants.json · {merchants.length} Active Key{merchants.length !== 1 ? 's' : ''}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs bg-slate-900 border border-slate-700 text-slate-300 rounded-lg flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Creation Form & Key Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Issue New Merchant Token</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Merchant Business Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Asia Gaming Store"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Authorized Domain (or * for any)
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. asiagaming.com, localhost, or *"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Generating Token...' : 'Generate 32-Char Hex Token'}</span>
            </button>
          </form>
        </div>

        {/* Merchant Directory Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-200">Authorized Merchant Credentials</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Live records synced with Python backend
            </span>
          </div>

          {merchants.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No merchants registered yet. Create your first token on the left.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 font-medium">Merchant</th>
                    <th className="py-2.5 px-3 font-medium">Domain Whitelist</th>
                    <th className="py-2.5 px-3 font-medium">32-Char Hex Token</th>
                    <th className="py-2.5 px-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {merchants.map((m) => {
                    const isCopied = copiedToken === m.token;
                    return (
                      <tr key={m.token} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-sans font-medium text-slate-200">
                          {m.merchant_name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Globe className="w-3 h-3 text-slate-500" />
                            {m.domain || '*'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <code className="text-amber-300 font-mono text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-[160px] md:max-w-[200px]">
                              {m.token}
                            </code>
                            <button
                              onClick={() => copyToClipboard(m.token)}
                              className="text-slate-500 hover:text-slate-300 p-1 rounded cursor-pointer"
                              title="Copy Token"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2 font-sans">
                            <button
                              onClick={() => onSelectForCheckout(m.token, m.domain)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] transition-colors cursor-pointer"
                            >
                              Test Deposit
                            </button>
                            <button
                              onClick={() => handleDelete(m.token)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Revoke Token"
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
          )}
        </div>
      </div>

      {/* Integration Code Preview */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Quick Merchant cURL Integration
          </h3>
        </div>
        <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
{`curl -X POST https://your-domain.com/api/request-deposit \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "merchant_token": "${merchants[0]?.token || 'YOUR_32_CHAR_HEX_TOKEN'}",
    "domain": "${merchants[0]?.domain || 'localhost'}"
  }'`}
        </pre>
      </div>
    </div>
  );
};
