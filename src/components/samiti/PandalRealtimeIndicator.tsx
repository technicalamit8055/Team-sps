import React, { useEffect, useState } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff, Loader2 } from 'lucide-react';

/**
 * Live-link status for the pandal counters.
 *
 * Worth a permanent badge rather than a toast: a collector who cannot tell a
 * quiet evening from a dead socket will keep writing receipts that no other
 * counter can see, and only discover the split at cash-up. The badge answers
 * "is what I am looking at current?" without anyone having to press refresh.
 */

/** "अभी-अभी" for the first minute, then minutes/hours since. */
function formatSince(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'अभी-अभी';
  if (mins < 60) return `${mins} मिनट पहले`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} घंटे पहले`;
}

interface PandalRealtimeIndicatorProps {
  className?: string;
  /** Compact variant for the dark header strip. */
  variant?: 'default' | 'header';
}

export const PandalRealtimeIndicator: React.FC<PandalRealtimeIndicatorProps> = ({
  className = '',
  variant = 'default',
}) => {
  const { realtimeStatus, lastSyncedAt, syncWithCloud, isSyncing } = useSamiti();

  // Keeps the relative age current: it is read by the offline label and by the
  // connected state's tooltip, neither of which re-renders on its own. A minute
  // tick is enough resolution for a label measured in minutes.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const since = formatSince(lastSyncedAt);
  const isHeader = variant === 'header';

  if (realtimeStatus === 'connected') {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
          isHeader
            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
            : 'border-emerald-300 bg-emerald-50 text-emerald-900'
        } ${className}`}
        title={since ? `अंतिम सिंक: ${since}` : undefined}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {/* No Wifi icon here: the pulsing dot already says "live", and at this
            size the two together just crowd a two-word badge. */}
        {/* No age shown while connected. `lastSyncedAt` marks the last
            reconnect, not the last donation, so a healthy socket would climb
            all evening -- and beside a green badge that reads as "nothing has
            arrived in 20 minutes", the exact doubt the badge exists to remove.
            It stays in the tooltip, where it is unambiguous. */}
        <span className="text-[12px] font-bold whitespace-nowrap">लाइव</span>
      </div>
    );
  }

  if (realtimeStatus === 'connecting') {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
          isHeader
            ? 'border-amber-400/40 bg-amber-500/15 text-amber-100'
            : 'border-amber-300 bg-amber-50 text-amber-900'
        } ${className}`}
      >
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        <span className="text-[12px] font-bold whitespace-nowrap">कनेक्ट...</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
        isHeader
          ? 'border-rose-400/40 bg-rose-500/15 text-rose-100'
          : 'border-rose-300 bg-rose-50 text-rose-900'
      } ${className}`}
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {/* Age is kept here, unlike the connected state: once the socket is
          down, how long ago the screen was last current is the whole
          question. */}
      <span className="text-[12px] font-bold whitespace-nowrap">
        ऑफ़लाइन{since ? ` · ${since}` : ''}
      </span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => { void syncWithCloud(); }}
        disabled={isSyncing}
        className={`h-6 rounded-full px-2 text-[11px] font-bold ${
          isHeader
            ? 'text-rose-100 hover:bg-rose-500/25 hover:text-white'
            : 'text-rose-900 hover:bg-rose-100'
        }`}
      >
        <RefreshCw className={`mr-1 h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden />
        सिंक
      </Button>
    </div>
  );
};
