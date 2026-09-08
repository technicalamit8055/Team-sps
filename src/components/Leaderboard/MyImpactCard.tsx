import React from 'react';
import { Trophy, TrendingUp, Star, Zap, Car } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { WorkerStats, PerformanceRank } from '@/hooks/useWorkerPerformance';

interface MyImpactCardProps {
  stats: WorkerStats | null;
  isLoading: boolean;
}

const rankStyles: Record<PerformanceRank, { bg: string; text: string; icon: React.ReactNode }> = {
  'Star Performer': {
    bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    text: 'text-yellow-900',
    icon: <Star className="w-5 h-5" />,
  },
  'Rising Leader': {
    bg: 'bg-gradient-to-r from-[hsl(30,100%,50%)] to-[hsl(30,100%,60%)]',
    text: 'text-white',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  'Active Worker': {
    bg: 'bg-gradient-to-r from-[hsl(240,100%,25%)] to-[hsl(240,80%,35%)]',
    text: 'text-white',
    icon: <Zap className="w-5 h-5" />,
  },
  'New Recruit': {
    bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
    text: 'text-white',
    icon: <Trophy className="w-5 h-5" />,
  },
};

export const MyImpactCard: React.FC<MyImpactCardProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-5 border border-white/30">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass-panel p-5 border border-white/30">
        <div className="text-center text-muted-foreground py-8">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>कोई डेटा उपलब्ध नहीं</p>
          <p className="text-sm mt-1">वोटर स्टेटस बदलें और पॉइंट्स कमाएं!</p>
        </div>
      </div>
    );
  }

  const rankStyle = rankStyles[stats.performance_rank];
  const conversionsToNext = stats.next_rank_threshold - stats.total_conversions;

  return (
    <div className="glass-panel p-5 border border-white/30 relative overflow-hidden">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(30,100%,50%,0.05)] to-[hsl(240,100%,25%,0.05)]" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full ${rankStyle.bg} ${rankStyle.text} flex items-center justify-center shadow-lg`}>
            {rankStyle.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">My Impact</h3>
            <Badge className={`${rankStyle.bg} ${rankStyle.text} border-0 text-xs`}>
              {stats.performance_rank}
            </Badge>
          </div>
        </div>
        
        {/* Rank Badge */}
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current Rank</p>
          <p className="text-2xl font-bold text-[hsl(var(--saffron))]">#{stats.current_rank}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
        <div className="bg-[hsl(var(--saffron),0.1)] rounded-xl p-4 border border-[hsl(var(--saffron),0.2)]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--saffron))]" />
            <span className="text-xs text-muted-foreground">Total Conversions</span>
          </div>
          <p className="text-3xl font-bold text-[hsl(var(--saffron))]">{stats.total_conversions}</p>
        </div>
        
        <div className="bg-[hsl(var(--navy),0.1)] rounded-xl p-4 border border-[hsl(var(--navy),0.2)]">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-[hsl(var(--navy))]" />
            <span className="text-xs text-muted-foreground">Total Points</span>
          </div>
          <p className="text-3xl font-bold text-[hsl(var(--navy))]">{stats.total_points} 🌟</p>
        </div>
      </div>

      {/* Period Stats */}
      <div className="flex gap-4 mb-4 text-sm relative z-10">
        <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
          <p className="font-semibold">{stats.conversions_7_days}</p>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </div>
        <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
          <p className="font-semibold">{stats.conversions_30_days}</p>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
      </div>

      {/* Priority Logistics Badge */}
      {stats.has_priority_logistics && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 mb-4 relative z-10">
          <Car className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Priority Logistics Assigned 🚗</span>
        </div>
      )}

      {/* Progress Bar */}
      {stats.performance_rank !== 'Star Performer' && (
        <div className="relative z-10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress to next rank</span>
            <span className="font-semibold text-[hsl(var(--saffron))]">
              {conversionsToNext > 0 ? `${conversionsToNext} more` : 'Achieved!'}
            </span>
          </div>
          <Progress value={stats.progress_to_next_rank} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {Math.round(stats.progress_to_next_rank)}% complete
          </p>
        </div>
      )}

      {stats.performance_rank === 'Star Performer' && (
        <div className="relative z-10 text-center p-3 rounded-xl bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-500/30">
          <p className="text-sm font-semibold text-yellow-700">
            🏆 Top Performer! Keep up the great work!
          </p>
        </div>
      )}
    </div>
  );
};
