import React, { useState } from 'react';
import { Trophy, TrendingUp, Medal, Car, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeaderboardEntry } from '@/hooks/useWorkerPerformance';

interface LeaderboardCardProps {
  leaderboard7Days: LeaderboardEntry[];
  leaderboard30Days: LeaderboardEntry[];
  isLoading: boolean;
  currentUserId?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <Crown className="w-5 h-5 text-yellow-900" />
        </div>
      );
    case 2:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg shadow-gray-400/30">
          <Medal className="w-5 h-5 text-gray-700" />
        </div>
      );
    case 3:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/30">
          <Medal className="w-5 h-5 text-amber-100" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
          {rank}
        </div>
      );
  }
};

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 border-0">🥇 Gold</Badge>;
    case 2:
      return <Badge className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 border-0">🥈 Silver</Badge>;
    case 3:
      return <Badge className="bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 border-0">🥉 Bronze</Badge>;
    default:
      return null;
  }
};

const LeaderboardList: React.FC<{ entries: LeaderboardEntry[]; currentUserId?: string }> = ({ 
  entries, 
  currentUserId 
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>अभी तक कोई conversions नहीं</p>
        <p className="text-sm mt-1">वोटर स्टेटस बदलें और लीडरबोर्ड पर आएं!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isCurrentUser = entry.worker_id === currentUserId;
        
        return (
          <div
            key={entry.worker_id}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
              isCurrentUser 
                ? 'bg-[hsl(var(--saffron),0.15)] border-2 border-[hsl(var(--saffron),0.3)]' 
                : 'bg-muted/50 hover:bg-muted/80'
            } ${entry.rank <= 3 ? 'shadow-md' : ''}`}
          >
            {/* Rank Icon */}
            {getRankIcon(entry.rank)}

            {/* Worker Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate">{entry.worker_name}</p>
                {getRankBadge(entry.rank)}
                {isCurrentUser && (
                  <Badge variant="outline" className="text-xs border-[hsl(var(--saffron))] text-[hsl(var(--saffron))]">
                    You
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1">
                {entry.has_priority_logistics && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <Car className="w-3 h-3" /> Priority
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--saffron))]" />
                <p className="text-xl font-bold text-[hsl(var(--saffron))]">{entry.total_conversions}</p>
              </div>
              <p className="text-xs text-muted-foreground">{entry.total_points} pts</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  leaderboard7Days,
  leaderboard30Days,
  isLoading,
  currentUserId,
}) => {
  const [period, setPeriod] = useState<'7' | '30'>('7');

  if (isLoading) {
    return (
      <div className="glass-panel p-5 border border-white/30">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 border border-white/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--saffron))] to-[hsl(var(--saffron-dark))] flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Victory Leaderboard</h3>
            <p className="text-xs text-muted-foreground">Top converters ranking</p>
          </div>
        </div>
      </div>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as '7' | '30')} className="mb-4">
        <TabsList className="grid grid-cols-2 w-full max-w-[200px]">
          <TabsTrigger value="7">7 Days</TabsTrigger>
          <TabsTrigger value="30">30 Days</TabsTrigger>
        </TabsList>

        <TabsContent value="7" className="mt-4">
          <LeaderboardList entries={leaderboard7Days} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="30" className="mt-4">
          <LeaderboardList entries={leaderboard30Days} currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
