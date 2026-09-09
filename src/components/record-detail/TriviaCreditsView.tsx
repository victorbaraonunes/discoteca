import React from 'react';
import { VinylRecord } from '../../types/vinyl';
import { useLanguage } from '../../i18n/LanguageContext';
import { Users } from 'lucide-react';

interface TriviaCreditsViewProps {
  record: VinylRecord;
}

export const TriviaCreditsView: React.FC<TriviaCreditsViewProps> = ({
  record,
}) => {
  const { t, language } = useLanguage();
  const localizedRole = (role: string) => {
    const normalizedRole = role.trim().toLowerCase();
    if (normalizedRole === 'primary artist') return t('creditPrimaryArtist');
    if (normalizedRole === 'producer') return t('creditProducer');
    if (normalizedRole === 'record label') return t('creditRecordLabel');
    return role;
  };

  return (
    <div>
      {record.credits.length > 0 ? (
        <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-rose-400">
            <Users className="w-3.5 h-3.5" />
            <span>{t('technicalCredits')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {record.credits.map((credit, idx) => (
              <div key={idx} className="p-2 bg-zinc-800/40 rounded-lg border border-zinc-800 text-xs">
                <span className="text-zinc-500 block text-[11px]">{localizedRole(credit.role)}</span>
                <span className="text-zinc-200 font-medium block truncate">{credit.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-zinc-500">
          {language === 'pt-BR' ? 'Nenhum crédito técnico registrado.' : 'No technical credits recorded.'}
        </p>
      )}
    </div>
  );
};
