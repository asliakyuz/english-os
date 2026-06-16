'use client';

import React from 'react';
import { BookOpen, MessageSquare, LayoutDashboard, CheckSquare, Calendar, Archive, ShieldCheck, BarChart3 } from 'lucide-react';

interface SidebarProps {
  activeTab: 'vocabulary' | 'archive' | 'oxford' | 'quiz' | 'journal' | 'goals' | 'grammar' | 'dashboard';
  setActiveTab: (tab: 'vocabulary' | 'archive' | 'oxford' | 'quiz' | 'journal' | 'goals' | 'grammar' | 'dashboard') => void;
  activeDays: number[];
}

export default function Sidebar({ activeTab, setActiveTab, activeDays }: SidebarProps) {
  const menuItems = [
    { name: 'Performance Dashboard', id: 'dashboard', icon: <BarChart3 size={16} /> }, // Yeni Bağımsız Sekme
    { name: 'Vocabulary Input', id: 'vocabulary', icon: <BookOpen size={16} /> },
    { name: 'Vocabulary Archive', id: 'archive', icon: <Archive size={16} /> },
    { name: 'Oxford 5000 Core', id: 'oxford', icon: <ShieldCheck size={16} /> },
    { name: 'Red Book Grammar', id: 'grammar', icon: <LayoutDashboard size={16} /> },
    { name: 'Journal / Daily Logs', id: 'journal', icon: <MessageSquare size={16} /> },
    { name: 'Targets / Goals', id: 'goals', icon: <CheckSquare size={16} /> },
  ];

  const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase();

  return (
    <div className="w-64 h-screen bg-[#130c25] border-r border-[#231742] flex flex-col justify-between p-4 fixed left-0 top-0 z-50 overflow-y-auto">
      <div className="space-y-6">
        {/* LOGO */}
        <div className="flex items-center gap-2 px-2 pt-2">
          <div className="w-2 h-2 rounded-full bg-[#06b6d4] shadow-[0_0_8px_#06b6d4] animate-pulse" />
          <h1 className="text-xs font-bold bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent tracking-widest font-mono">
            ENGLISH.OS
          </h1>
        </div>

        {/* TRACKER TAKVİM */}
        <div className="bg-[#0d071a] border border-[#231742] p-3 rounded-xl space-y-2 mx-1">
          <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 font-mono tracking-wider">
            <Calendar size={10} className="text-[#06b6d4]" /> {currentMonthName} TRACKER
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: totalDaysInMonth }, (_, i) => {
              const dayNumber = i + 1;
              const isToday = dayNumber === new Date().getDate();
              const hasActivity = activeDays.includes(dayNumber);

              return (
                <div
                  key={dayNumber}
                  className={`w-5 h-5 rounded-sm flex items-center justify-center text-[8px] font-bold font-mono transition-all ${
                    hasActivity
                      ? 'bg-emerald-500 text-white shadow-[0_0_5px_rgba(16,185,129,0.5)]'
                      : isToday
                        ? 'border border-[#06b6d4] text-[#06b6d4] bg-[#1c1236]'
                        : 'bg-[#181130] text-gray-600'
                  }`}
                >
                  {dayNumber}
                </div>
              );
            })}
          </div>
        </div>

        {/* MENÜ BUTONLARI */}
        <nav className="space-y-1 font-mono">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 group text-left ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#29174f] to-[#130c25] text-[#a855f7] border-l-2 border-[#a855f7]' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1033]'
                }`}
              >
                <span className={isActive ? 'text-[#a855f7]' : 'text-gray-500 group-hover:text-[#06b6d4]'}>
                  {item.icon}
                </span>
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[#231742] pt-4 px-2 flex items-center justify-between text-[9px] text-gray-500 font-mono">
        <span>SYS: ONLINE</span>
        <span className="text-[#06b6d4]">AKYUZ_USER</span>
      </div>
    </div>
  );
}