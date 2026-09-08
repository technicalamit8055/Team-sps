/**
 * TotalStatsBar - Displays aggregate statistics across all wards
 */
import React from 'react';
import { Users, ThumbsUp, ThumbsDown, Minus, Vote } from 'lucide-react';

interface TotalStatsBarProps {
  total: number;
  support: number;
  oppose: number;
  neutral: number;
  voted: number;
}

export const TotalStatsBar: React.FC<TotalStatsBarProps> = ({
  total,
  support,
  oppose,
  neutral,
  voted,
}) => {
  const supportPct = total > 0 ? Math.round((support / total) * 100) : 0;
  const opposePct = total > 0 ? Math.round((oppose / total) * 100) : 0;
  const neutralPct = total > 0 ? Math.round((neutral / total) * 100) : 0;
  const votedPct = total > 0 ? Math.round((voted / total) * 100) : 0;

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-secondary" />
          कुल आंकड़े
        </h3>
        <span className="text-sm text-muted-foreground">{total.toLocaleString('hi-IN')} मतदाता</span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700 mb-3">
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
          style={{ width: `${supportPct}%` }}
        />
        <div
          className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
          style={{ width: `${opposePct}%` }}
        />
        <div
          className="bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-500"
          style={{ width: `${neutralPct}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        <div>
          <div className="flex items-center justify-center gap-1 text-emerald-600">
            <ThumbsUp className="w-4 h-4" />
            <span className="font-semibold">{support.toLocaleString('hi-IN')}</span>
          </div>
          <div className="text-xs text-muted-foreground">{supportPct}% समर्थक</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-red-600">
            <ThumbsDown className="w-4 h-4" />
            <span className="font-semibold">{oppose.toLocaleString('hi-IN')}</span>
          </div>
          <div className="text-xs text-muted-foreground">{opposePct}% विरोधी</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-gray-500">
            <Minus className="w-4 h-4" />
            <span className="font-semibold">{neutral.toLocaleString('hi-IN')}</span>
          </div>
          <div className="text-xs text-muted-foreground">{neutralPct}% तटस्थ</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-primary">
            <Vote className="w-4 h-4" />
            <span className="font-semibold">{voted.toLocaleString('hi-IN')}</span>
          </div>
          <div className="text-xs text-muted-foreground">{votedPct}% मतदान</div>
        </div>
      </div>
    </div>
  );
};
