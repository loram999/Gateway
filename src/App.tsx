/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { WaveAccountManager } from './components/WaveAccountManager';
import { ApiDocsPage } from './components/ApiDocsPage';
import { AdminPanel990 } from './components/AdminPanel990';
import { WaveAccount } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('accounts');
  const [accounts, setAccounts] = useState<WaveAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check URL path or hash on initial load (support /admin990 directly!)
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin990' || hash === '#admin990') {
      setActiveTab('admin990');
    }
  }, []);

  const fetchData = async () => {
    try {
      const accountsRes = await fetch('/api/accounts');
      if (accountsRes.ok) {
        const ct = accountsRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const aData = await accountsRes.json();
          setAccounts(Array.isArray(aData) ? aData : (aData?.accounts || []));
        }
      }
    } catch (err) {
      console.error('Error loading accounts data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black w-full overflow-x-hidden">
      {/* 3-Tab Focused Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accountCount={accounts.length}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {activeTab === 'accounts' && (
          <WaveAccountManager
            onNavigateToApiDocs={() => setActiveTab('apidocs')}
            onRefreshGlobal={fetchData}
          />
        )}

        {activeTab === 'apidocs' && (
          <ApiDocsPage />
        )}

        {activeTab === 'admin990' && (
          <AdminPanel990
            onRefresh={fetchData}
          />
        )}
      </main>

      {/* Clean Monochrome Footer */}
      <footer className="border-t border-zinc-900 bg-black py-5 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">WavePay Gateway</span>
            <span aria-hidden="true">·</span>
            <span>Wave အကောင့်များ · API စာရွက်စာတမ်း · Admin Panel</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-500">
            <span>Admin ID: 8353748526</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('admin990')}
              className="text-zinc-300 hover:text-white cursor-pointer underline underline-offset-2"
            >
              /admin990 Panel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
