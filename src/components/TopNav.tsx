import React from 'react';
import { Smartphone, BookOpen, ShieldAlert } from 'lucide-react';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  accountCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  accountCount,
}) => {
  const navItems = [
    { 
      id: 'accounts', 
      label: 'Wave Accounts', 
      mmLabel: 'Wave အကောင့်များ',
      icon: Smartphone 
    },
    { 
      id: 'apidocs', 
      label: 'API Documents', 
      mmLabel: 'API စာရွက်စာတမ်း',
      icon: BookOpen 
    },
    { 
      id: 'admin990', 
      label: 'Admin Panel', 
      mmLabel: '/admin990',
      icon: ShieldAlert,
    },
  ];

  return (
    <header className="border-b border-zinc-800 bg-black sticky top-0 z-40 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name (Monochrome) */}
        <div 
          onClick={() => setActiveTab('accounts')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white flex items-center justify-center text-black font-black text-xs sm:text-sm">
            W
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap leading-tight">
              Wave Gateway
            </span>
            <span className="text-[10px] font-mono text-zinc-400 leading-tight">
              Auto Deposit & Withdraw
            </span>
          </div>
        </div>

        {/* 3 Navigation Tabs (Black & White) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.mmLabel}</span>
                <span className="sm:hidden text-xs">
                  {item.id === 'accounts' ? 'Accounts' : item.id === 'apidocs' ? 'API Docs' : '/admin990'}
                </span>
                {item.id === 'accounts' && accountCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {accountCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
