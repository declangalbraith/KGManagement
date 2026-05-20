import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  BarChart3,
  Settings,
  ShieldAlert,
  Files,
  Database,
  Network
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { name: t('sidebar.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('sidebar.issues'), path: '/issues', icon: Ticket },
    { name: 'BOM 管理', path: '/bom-management', icon: Database },
    { name: '图谱 Schema 设计', path: '/schema', icon: Network },
    { name: t('sidebar.qualityDocs'), path: '/quality-docs', icon: Files },
    { name: t('sidebar.knowledge'), path: '/knowledge', icon: BookOpen },
    { name: t('sidebar.analytics'), path: '/analytics', icon: BarChart3 },
    { name: t('sidebar.admin'), path: '/admin', icon: Settings },
    { name: t('sidebar.audit'), path: '/audit', icon: ShieldAlert },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card/95 backdrop-blur-xl text-card-foreground shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">
      <div className="flex h-16 items-center px-6 mb-4">
        <div className="flex items-center gap-3 font-bold text-lg tracking-wider text-primary">
          <div className="flex shrink-0">
             {/* Simple Knorr-Bremse like typographic logo */}
             <span className="font-sans font-extrabold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-1 text-xs whitespace-nowrap">KNORR-BREMSE</span>
          </div>
          <span className="font-sans text-sm text-muted-foreground whitespace-nowrap">Quality Center</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1.5 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "bg-primary/10 text-primary dark:text-primary-300" 
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-primary dark:text-primary-300" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
