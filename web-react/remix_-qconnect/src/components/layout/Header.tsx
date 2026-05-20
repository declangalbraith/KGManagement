import React from 'react';
import { Bell, Search, User, Globe } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Header() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-md px-6 sticky top-0 z-50">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-96 group mt-1.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder={t('header.search')}
            className="w-full bg-muted/50 pl-10 shadow-none border-transparent focus-visible:border-primary/30 focus-visible:bg-background transition-all rounded-md h-10"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="rounded-md hover:bg-muted font-medium text-xs px-3 border border-transparent hover:border-border transition-colors" onClick={toggleLanguage} title="Switch Language">
          <Globe className="h-4 w-4 mr-1.5 text-muted-foreground" />
          {i18n.language.startsWith('zh') ? 'EN' : 'CN'}
        </Button>
        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative rounded-md hover:bg-muted" title={t('header.notifications')}>
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive border-2 border-card"></span>
          </Button>
        </Link>
        <div className="flex items-center gap-3 border-l pl-4 ml-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 shadow-sm border border-primary/10">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium leading-none mb-1">张三</div>
            <div className="text-xs text-muted-foreground leading-none">系统管理员</div>
          </div>
        </div>
      </div>
    </header>
  );
}
