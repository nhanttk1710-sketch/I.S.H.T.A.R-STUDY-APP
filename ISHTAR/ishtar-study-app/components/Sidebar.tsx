"use client";

import React from 'react';
import {
  LayoutGrid,
  Calendar,
  CheckSquare,
  BarChart3,
  Timer,
  Folder,
  Languages,
  Layers,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles
} from 'lucide-react';
import { IshtarLogo } from './IshtarLogo';
import type { TabId } from './types';

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  sealImageUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  active = 'overview',
  onChange,
  collapsed = false,
  onToggle,
  sealImageUrl = "/ishtar-seal.png"
}) => {
  const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutGrid },
    { id: 'schedule', label: 'Thời khóa biểu', icon: Calendar },
    { id: 'tasks', label: 'Bài tập & Deadline', icon: CheckSquare },
    { id: 'grades', label: 'Điểm số & GPA', icon: BarChart3 },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
    { id: 'resources', label: 'Tài liệu', icon: Folder },
    { id: 'language', label: 'Ngôn ngữ', icon: Languages },
    { id: 'flashcards', label: 'Flashcard', icon: Layers },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <aside
      className={`${collapsed ? 'w-20 p-2' : 'w-60 p-3'} h-screen bg-white/95 backdrop-blur-md border-r border-slate-100 flex flex-col justify-between shrink-0 select-none z-20 transition-all duration-300`}
    >
      <div className="space-y-2">
        <IshtarLogo className={collapsed ? "w-12" : "w-44"} collapsed={collapsed} sealImageUrl={sealImageUrl} />

        {!collapsed && (
          <div className="flex items-center gap-2 px-2 pt-2 pb-1 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            <span>KHÔNG GIAN HỌC TẬP</span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-200/60 to-transparent" />
            <span className="text-amber-400 text-xs">✦</span>
          </div>
        )}

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChange && onChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                } rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-100/70 border border-amber-200/60 text-amber-900 font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-amber-50/50 hover:text-amber-800'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </div>

                {!collapsed && isActive && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={onToggle}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center px-2' : 'gap-2 px-3'
          } py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors`}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span>Thu gọn thanh bên</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
