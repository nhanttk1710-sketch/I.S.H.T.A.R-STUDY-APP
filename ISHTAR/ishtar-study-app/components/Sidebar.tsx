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
  Sparkles,
} from 'lucide-react';
import type { TabId } from './types';
import { IshtarLogo } from './IshtarLogo';

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
  logoImageUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  active = 'overview',
  onChange,
  collapsed = false,
  onToggle,
  logoImageUrl = '/ishtar-logo.webp',
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
      className={`${
        collapsed ? 'w-20 p-2' : 'w-60 p-3'
      } h-screen bg-[#FCFCFC] border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none z-20 transition-all duration-300`}
    >
      <div className="space-y-3">
        <IshtarLogo
          className={collapsed ? 'w-12' : 'w-44'}
          collapsed={collapsed}
          logoUrl={logoImageUrl}
        />

        {!collapsed && (
          <div className="flex items-center gap-2 px-2 pt-1 text-[11px] font-bold tracking-wider text-[#78716C] uppercase">
            <span>KHÔNG GIAN HỌC TẬP</span>
            <div className="h-[1px] flex-1 bg-[#F5F5F4]" />
            <span className="text-amber-500 text-xs">✦</span>
          </div>
        )}

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                } rounded-xl text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FFF8E7] border border-[#FDE68A]/80 text-[#B45309] font-bold shadow-sm'
                    : 'text-[#57534E] font-semibold hover:text-[#B45309] hover:bg-[#FFFBEB]/60'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D97706]' : 'text-[#A8A29E]'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </div>

                {!collapsed && isActive && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-2 border-t border-slate-200/60">
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Mở rộng thanh bên' : undefined}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center px-2' : 'gap-2 px-3'
          } py-2 text-xs text-[#A8A29E] hover:text-[#57534E] hover:bg-slate-100/60 rounded-lg transition-colors`}
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
