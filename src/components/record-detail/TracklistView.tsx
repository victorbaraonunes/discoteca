import React from 'react';
import { Track } from '../../types/vinyl';
import { useLanguage } from '../../i18n/LanguageContext';
import { Music, Clock } from 'lucide-react';

interface TracklistViewProps {
  tracks: Track[];
}

export const TracklistView: React.FC<TracklistViewProps> = ({ tracks }) => {
  const { language } = useLanguage();
  const isPt = language === 'pt-BR';

  if (!tracks || tracks.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-500 text-sm">
        {isPt ? 'Nenhuma faixa registrada para este disco.' : 'No tracklist recorded for this vinyl yet.'}
      </div>
    );
  }

  // Group tracks by Side (e.g. A, B, C, D)
  const sidesMap: Record<string, Track[]> = {};
  tracks.forEach((track) => {
    const side = track.position.charAt(0).toUpperCase();
    const sideKey = side.match(/[A-Z]/) ? (isPt ? `Lado ${side}` : `Side ${side}`) : (isPt ? 'Faixas' : 'Tracks');
    if (!sidesMap[sideKey]) {
      sidesMap[sideKey] = [];
    }
    sidesMap[sideKey].push(track);
  });

  return (
    <div className="space-y-6">
      {Object.entries(sidesMap).map(([sideName, sideTracks]) => (
        <div key={sideName} className="bg-zinc-900/60 rounded-xl p-3.5 border border-zinc-800/80">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-rose-400">
            <Music className="w-3.5 h-3.5" />
            <span>{sideName}</span>
          </div>

          <div className="divide-y divide-zinc-800/40">
            {sideTracks.map((track, idx) => (
              <div
                key={idx}
                className="py-2 px-1 flex items-center justify-between gap-3 text-sm hover:bg-zinc-800/30 rounded transition-colors"
              >
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-zinc-500 w-6 shrink-0">
                    {track.position}
                  </span>
                  <div className="truncate">
                    <span className="text-zinc-200 font-medium truncate block">{track.title}</span>
                    {track.credits && (
                      <span className="text-[11px] text-zinc-500 truncate block">{track.credits}</span>
                    )}
                  </div>
                </div>

                {track.duration && (
                  <div className="flex items-center gap-1 text-xs font-mono text-zinc-400 shrink-0">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span>{track.duration}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
