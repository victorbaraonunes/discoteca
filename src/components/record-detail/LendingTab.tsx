import React, { useState, useRef } from 'react';
import { VinylRecord, LoanRecord } from '../../types/vinyl';
import { db } from '../../db/database';
import { generateUUID } from '../../utils/formatters';
import { formatDateTime, isLoanOverdue } from '../../utils/formatters';
import { useLanguage } from '../../i18n/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Clock, CheckCircle2, AlertTriangle, User, Phone, Calendar, Printer, History } from 'lucide-react';

interface LendingTabProps {
  record: VinylRecord;
  onRecordUpdated: (updated: VinylRecord) => void;
}

export const LendingTab: React.FC<LendingTabProps> = ({
  record,
  onRecordUpdated,
}) => {
  const { t, language } = useLanguage();

  // Calculate default return date: 14 days from now at 18:00
  const getDefaultReturnDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setHours(18, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState(getDefaultReturnDate());
  const [loanNotes, setLoanNotes] = useState('');
  const [isExtending, setIsExtending] = useState(false);
  const [newReturnDate, setNewReturnDate] = useState(getDefaultReturnDate());
  
  const qrRef = useRef<HTMLDivElement>(null);

  const isOverdue = record.isLoaned && isLoanOverdue(record.currentLoan?.expectedReturnAt);

  // QR Code Value
  const qrPayload = JSON.stringify({
    app: 'discoteca',
    type: 'vinyl_record',
    id: record.id,
    title: record.title,
    artist: record.artist,
    borrower: record.currentLoan?.borrowerName || null,
    returnDate: record.currentLoan?.expectedReturnAt || null,
  });

  const handleLendRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) return;

    const newLoan: LoanRecord = {
      id: generateUUID(),
      borrowerName: borrowerName.trim(),
      borrowerContact: borrowerContact.trim() || undefined,
      borrowedAt: new Date().toISOString(),
      expectedReturnAt: new Date(expectedReturnAt).toISOString(),
      status: 'active',
      notes: loanNotes.trim() || undefined,
    };

    const updated: VinylRecord = {
      ...record,
      isLoaned: true,
      currentLoan: newLoan,
    };

    await db.records.put(updated);
    onRecordUpdated(updated);

    // Reset form
    setBorrowerName('');
    setBorrowerContact('');
    setLoanNotes('');
  };

  const handleReturnRecord = async () => {
    if (!record.currentLoan) return;

    const completedLoan: LoanRecord = {
      ...record.currentLoan,
      returnedAt: new Date().toISOString(),
      status: 'returned',
    };

    const updated: VinylRecord = {
      ...record,
      isLoaned: false,
      currentLoan: undefined,
      loanHistory: [completedLoan, ...(record.loanHistory || [])],
    };

    await db.records.put(updated);
    onRecordUpdated(updated);
  };

  const handleExtendReturnDate = async () => {
    if (!record.currentLoan) return;

    const updatedLoan: LoanRecord = {
      ...record.currentLoan,
      expectedReturnAt: new Date(newReturnDate).toISOString(),
    };

    const updated: VinylRecord = {
      ...record,
      currentLoan: updatedLoan,
    };

    await db.records.put(updated);
    onRecordUpdated(updated);
    setIsExtending(false);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Current Loan Status Card */}
      {record.isLoaned && record.currentLoan ? (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isOverdue
              ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-900/30'
              : 'bg-blue-950/30 border-blue-600/50 shadow-lg shadow-blue-900/20'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Share2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-white">{t('currentlyOnLoan')}</h4>
                <p className="text-xs text-zinc-400">
                  {isOverdue ? (
                    <span className="text-rose-400 font-semibold">{t('overdueWarning')}</span>
                  ) : (
                    t('lentToFriend')
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleReturnRecord}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('markAsReturned')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-500 block text-[11px] mb-0.5">{t('borrower')}</span>
              <span className="text-zinc-200 font-bold text-sm block">{record.currentLoan.borrowerName}</span>
              {record.currentLoan.borrowerContact && (
                <span className="text-zinc-400 block mt-1">{record.currentLoan.borrowerContact}</span>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-500 block text-[11px] mb-0.5">{t('returnDeadline')}</span>
              <span className={`font-bold text-sm block ${isOverdue ? 'text-rose-400' : 'text-zinc-200'}`}>
                {formatDateTime(record.currentLoan.expectedReturnAt, language)}
              </span>
              <span className="text-zinc-500 text-[11px] block mt-1">
                {t('lentOn')} {formatDateTime(record.currentLoan.borrowedAt, language)}
              </span>
            </div>
          </div>

          {record.currentLoan.notes && (
            <div className="mt-3 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-300">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">{t('loanNotes')}</span>
              <p className="mt-0.5">{record.currentLoan.notes}</p>
            </div>
          )}

          {/* Extend Return Date */}
          <div className="mt-3 pt-2 flex items-center justify-between border-t border-zinc-800/60 text-xs">
            {isExtending ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="datetime-local"
                  value={newReturnDate}
                  onChange={(e) => setNewReturnDate(e.target.value)}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200"
                />
                <button
                  onClick={handleExtendReturnDate}
                  className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded text-xs"
                >
                  {t('save')}
                </button>
                <button
                  onClick={() => setIsExtending(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsExtending(true)}
                className="text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t('extendReturnDate')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Lend Record Form */
        <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/80">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-800">
            <Share2 className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-bold text-white">{t('lendThisRecord')}</h4>
          </div>

          <form onSubmit={handleLendRecord} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('borrowerNameReq')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="e.g. Maria Silva"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">{t('contactPhoneEmail')}</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={borrowerContact}
                    onChange={(e) => setBorrowerContact(e.target.value)}
                    placeholder="e.g. (11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {t('expectedReturnDateReq')} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="datetime-local"
                    required
                    value={expectedReturnAt}
                    onChange={(e) => setExpectedReturnAt(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">{t('loanNotes')}</label>
              <textarea
                rows={2}
                value={loanNotes}
                onChange={(e) => setLoanNotes(e.target.value)}
                placeholder={t('handlingAdvicePlaceholder')}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-950/50 active:scale-[0.99] transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('confirmLoanBtn')}</span>
            </button>
          </form>
        </div>
      )}

      {/* QR Code & Printable Loan Slip */}
      <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/80">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <div>
            <h4 className="text-sm font-bold text-white">{t('recordQrCode')}</h4>
            <p className="text-xs text-zinc-400">{t('scanQrHelp')}</p>
          </div>
          <button
            onClick={handlePrintSlip}
            title="Print Loan Slip"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-zinc-950 rounded-xl border border-zinc-800/60">
          <div ref={qrRef} className="p-3 bg-white rounded-xl shadow-lg shrink-0">
            <QRCodeSVG
              value={qrPayload}
              size={130}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-block">
              {t('discotecaPass')}
            </span>
            <h5 className="text-sm font-bold text-zinc-100">{record.title}</h5>
            <p className="text-xs text-zinc-400">{record.artist}</p>
            {record.releaseYear && (
              <p className="text-xs text-zinc-500">{t('releasedIn')} {record.releaseYear}</p>
            )}

            {record.isLoaned && record.currentLoan && (
              <div className="pt-2 text-xs text-rose-300 font-medium">
                {t('borrower')}: {record.currentLoan.borrowerName} • {t('returnDeadline')}: {formatDateTime(record.currentLoan.expectedReturnAt, language)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loan History */}
      {record.loanHistory && record.loanHistory.length > 0 && (
        <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/80">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-rose-400">
            <History className="w-3.5 h-3.5" />
            <span>{t('lendingHistory')}</span>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {record.loanHistory.map((hist, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-zinc-200 block">{hist.borrowerName}</span>
                  <span className="text-zinc-500 text-[11px]">
                    {t('borrowedAtLabel')}: {formatDateTime(hist.borrowedAt, language)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-[10px] font-bold">
                    {t('returnedStatus')}
                  </span>
                  <span className="text-zinc-500 text-[11px] block mt-0.5">
                    {formatDateTime(hist.returnedAt, language)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
