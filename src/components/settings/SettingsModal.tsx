import React, { useState } from 'react';
import { exportCollectionToJson, importCollectionFromJson, exportCollectionToCsv } from '../../services/exportService';
import { db } from '../../db/database';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  X,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Globe
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { t, language, setLanguage, defaultCurrency, setDefaultCurrency } = useLanguage();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Backup & Restore
  const handleExportJson = async () => {
    setIsProcessing(true);
    setStatus(null);
    try {
      await exportCollectionToJson();
      setStatus({ type: 'success', message: t('backupCreated') });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCsv = async () => {
    setIsProcessing(true);
    setStatus(null);
    try {
      await exportCollectionToCsv();
      setStatus({ type: 'success', message: t('csvExported') });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'merge' | 'overwrite') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mode === 'overwrite') {
      const confirm = window.confirm(t('dangerOverwrite'));
      if (!confirm) {
        e.target.value = '';
        return;
      }
    }

    setIsProcessing(true);
    setStatus(null);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const jsonString = ev.target?.result as string;
          await importCollectionFromJson(jsonString, mode === 'overwrite' ? 'replace' : mode);
          setStatus({ type: 'success', message: t('importSuccess') });
        } catch (err: any) {
          setStatus({ type: 'error', message: err.message });
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
      setIsProcessing(false);
    }
    e.target.value = '';
  };

  const handleWipeDatabase = async () => {
    const confirm1 = window.confirm(t('dangerWipe'));
    if (!confirm1) return;
    const confirm2 = window.confirm(t('dangerWipeConfirm'));
    if (!confirm2) return;

    setIsProcessing(true);
    setStatus(null);
    try {
      await db.records.clear();
      setStatus({ type: 'success', message: t('wipeSuccess') });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#140e13] border border-rose-950/60 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-zinc-800 bg-[#181116]/80">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-rose-500" />
            {t('settings')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[80vh] space-y-6">
          {status && (
            <div
              className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${
                status.type === 'error'
                  ? 'bg-rose-950/50 border-rose-900/50 text-rose-300'
                  : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
              }`}
            >
              {status.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* Language / Region */}
          <section>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-zinc-400" /> {t('languageRegion')}
            </h3>
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
              <label className="block text-xs text-zinc-400 mb-2">{t('selectLanguage')}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'pt-BR')}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
              </select>
              <label className="block text-xs text-zinc-400 mt-4 mb-2">{t('currency')}</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value as 'BRL' | 'USD')}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
              >
                <option value="BRL">{t('currencyBrl')}</option>
                <option value="USD">{t('currencyUsd')}</option>
              </select>
            </div>
          </section>

          {/* Backup & Export */}
          <section>
            <h3 className="text-sm font-bold text-zinc-100 mb-3">{t('backupExport')}</h3>
            <div className="space-y-3">
              <button
                onClick={handleExportJson}
                disabled={isProcessing}
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 flex items-center gap-3 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-zinc-200">{t('createBackup')}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">{t('createBackupDesc')}</span>
                </div>
              </button>

              <button
                onClick={handleExportCsv}
                disabled={isProcessing}
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 flex items-center gap-3 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-zinc-200">{t('exportCsv')}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">{t('exportCsvDesc')}</span>
                </div>
              </button>
            </div>
          </section>

          {/* Restore & Import */}
          <section>
            <h3 className="text-sm font-bold text-zinc-100 mb-3">{t('restoreImport')}</h3>
            <div className="space-y-3">
              <label className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 flex items-center gap-3 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => handleImportJson(e, 'merge')}
                  disabled={isProcessing}
                />
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-zinc-200">{t('mergeBackup')}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">{t('mergeBackupDesc')}</span>
                </div>
              </label>

              <label className="w-full p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 hover:bg-rose-900/30 flex items-center gap-3 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => handleImportJson(e, 'overwrite')}
                  disabled={isProcessing}
                />
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-rose-200">{t('overwriteBackup')}</span>
                  <span className="block text-xs text-rose-400/70 mt-0.5">{t('overwriteBackupDesc')}</span>
                </div>
              </label>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="pt-4 border-t border-zinc-800">
            <button
              onClick={handleWipeDatabase}
              disabled={isProcessing}
              className="px-4 py-2 bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-xs font-bold rounded-lg transition-all"
            >
              {t('wipeDatabaseBtn')}
            </button>
            <p className="text-[10px] text-zinc-600 mt-2">
              {t('wipeDatabaseHelp')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
