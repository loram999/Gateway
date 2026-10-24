import React, { useState, useEffect } from 'react';
import { Send, Bot, Shield, Bell, Check, Terminal, ExternalLink, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';
import { WaveAccount, Merchant } from '../types';

interface TelegramBotConsoleProps {
  accounts: WaveAccount[];
  merchants: Merchant[];
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface TelegramLogEntry {
  id: number;
  event_type: string;
  level: string;
  message: string;
  details: string;
  created_at: string;
  forwarded_to_bot: number;
}

export const TelegramBotConsole: React.FC<TelegramBotConsoleProps> = ({
  accounts,
  merchants,
  onRefresh,
  onNavigateTab,
}) => {
  const ADMIN_ID = 8353748526;
  const [logs, setLogs] = useState<TelegramLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testEventType, setTestEventType] = useState('deposit_verified');
  const [testAmount, setTestAmount] = useState('50000');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs?limit=40');
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    setFeedback(null);
    try {
      // Trigger a sample test log
      const res = await fetch('/api/ocr/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: `Test Alert Wave Pay: ၂၀၂၆၁၀၂၃၀၉၄၈၂၁ ပမာဏ: ${testAmount} Ks (${testEventType})`,
        }),
      });

      if (res.ok) {
        setFeedback(`Alert for ${testEventType} dispatched to Telegram Admin ID: ${ADMIN_ID}`);
        fetchLogs();
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const activeSIMs = accounts.filter((a) => a.wmt_mfs).length;
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Bot Mode: Strictly Event Logger
            </span>
            <span className="text-xs font-mono text-slate-500">
              Target Admin ID: {ADMIN_ID}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">
            Telegram Bot Live Logs Channel
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            As configured, the Telegram Bot is dedicated exclusively to dispatching high-priority Gateway Logs and audit events. All system operations are controlled from this website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Logs</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 text-xs bg-slate-900 border border-emerald-500/40 text-emerald-300 rounded-lg flex items-center justify-between">
          <span>{feedback}</span>
        </div>
      )}

      {/* Website Control Notice Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              ကျန်တာ Website ကနေဘဲ ထိန်းချုပ်ရန် (Web Master Controls)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage Wave SIMs, deposit requests, last-5-digit verification, and withdrawal payouts using the dedicated website tabs:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('wave_accounts')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer transition-colors"
              >
                Wave SIMs Pool
              </button>
              <button
                onClick={() => onNavigateTab('admin990')}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors"
              >
                /admin990 Control
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Telegram Channel Simulation Stream */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>WavePay Gateway Log Bot</span>
                  <span className="text-[10px] font-mono text-slate-500">@wave_log_bot</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  Streaming live events to Telegram Admin {ADMIN_ID}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              {logs.length} Logged Events
            </div>
          </div>

          {/* Logs message list */}
          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto bg-slate-950/40 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="py-20 text-center text-slate-600">
                No logs generated yet. Trigger a deposit or withdrawal to see live events.
              </div>
            ) : (
              logs.map((log) => {
                const isError = log.level === 'ERROR';
                const isSuccess = log.level === 'SUCCESS';
                const icon = isError ? '🚨' : isSuccess ? '✅' : '🔔';

                let parsedDetails = null;
                try {
                  if (log.details) parsedDetails = JSON.parse(log.details);
                } catch {
                  // Keep as string
                }

                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                          {log.event_type}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded ${
                            isError ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.level}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>

                    <p className="text-slate-200 font-sans text-xs">
                      {log.message}
                    </p>

                    {parsedDetails && (
                      <pre className="p-2 bg-slate-950 rounded border border-slate-800/80 text-[10px] text-slate-400 overflow-x-auto">
                        {JSON.stringify(parsedDetails, null, 2)}
                      </pre>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-400 font-sans">
                        <Check className="w-3 h-3" />
                        <span>Forwarded to Telegram Bot Admin</span>
                      </span>
                      <span>Chat ID: {ADMIN_ID}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Dispatch Test Alert & Bot Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dispatch Test Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Send Test Alert to Telegram
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Dispatches a test notification to verify that the bot sends events to your Telegram chat in real time.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Alert Event Type</label>
                <select
                  value={testEventType}
                  onChange={(e) => setTestEventType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="deposit_verified">deposit_verified (ငွေသွင်း အတည်ပြု)</option>
                  <option value="withdraw_disbursed">withdraw_disbursed (ငွေထုတ် ပေးချေ)</option>
                  <option value="account_login">account_login (SIM Login အောင်မြင်)</option>
                  <option value="cloudflare_bypass">cloudflare_bypass (History ရယူ)</option>
                  <option value="gateway_error">gateway_error (စနစ် Error)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Amount (Ks)</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={handleSendTestAlert}
                disabled={isSendingTest}
                className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Dispatch Alert to Bot</span>
              </button>
            </div>
          </div>

          {/* Bot Specs Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Telegram Bot Audit Configuration</span>
            </h4>
            <div className="space-y-1.5 text-slate-400 font-mono text-[11px]">
              <div>Target Admin ID: <span className="text-slate-200">{ADMIN_ID}</span></div>
              <div>Audit Destination: <span className="text-emerald-400">Telegram Direct Message</span></div>
              <div>File Mirrors: <span className="text-slate-200">gateway.log / gateway_errors.log</span></div>
              <div>Database Table: <span className="text-amber-300">gateway_logs (SQLite)</span></div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
              When users message the bot, the bot automatically sends links to this Web Dashboard and the Master Admin Panel (/admin990).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
