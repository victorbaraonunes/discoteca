import React from 'react';
import { Disc3, Plus, QrCode, Settings, Search, X, Share2, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
  loanedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenScanner,
  onOpenSettings,
  loanedCount,
}) => {
  const { t, language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#120d11]/90 backdrop-blur-md border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1.5 sm:gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-rose-600 to-rose-900 shadow-lg shadow-rose-900/30 text-white">
              <Disc3 className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">{t('appName')}</h1>
                {loanedCount > 0 && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    <Share2 className="w-3 h-3" /> {loanedCount} {t('onLoanBadge')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 min-w-0 max-w-md mx-0 sm:mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 text-sm bg-zinc-900/90 border border-zinc-700/70 rounded-full text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title={language === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
              className="px-2 py-1.5 sm:px-2.5 text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'pt-BR' ? 'PT' : 'EN'}</span>
            </button>

            {/* Scan QR / Barcode Button */}
            <button
              onClick={onOpenScanner}
              title={t('scanQr')}
              className="p-1.5 sm:px-3 sm:py-2 text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <QrCode className="w-4 h-4 text-rose-400" />
              <span className="hidden md:inline">{t('scanQr')}</span>
            </button>

            {/* Add Record Button */}
            <button
              onClick={onOpenAddModal}
              className="hidden sm:flex px-3 py-2 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-semibold rounded-lg text-sm items-center gap-1.5 shadow-md shadow-rose-950/50 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{t('addRecord')}</span>
              <span className="sm:hidden">{t('addRecord').split(' ')[0]}</span>
            </button>

            {/* Settings & Backup */}
            <button
              onClick={onOpenSettings}
              title={t('settings')}
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-900/40 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all active:scale-95"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
