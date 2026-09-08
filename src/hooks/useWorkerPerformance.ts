/**
 * useWorkerPerformance - Worker Incentive & Leaderboard Hook
 * 
 * Features:
 * - Fetches worker leaderboard (top 10 by conversions)
 * - Fetches current worker's stats (My Impact)
 * - Calculates performance rank
 * - Manages reward distribution (admin)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type PerformanceRank = 'Star Performer' | 'Rising Leader' | 'Active Worker' | 'New Recruit';

export interface LeaderboardEntry {
  worker_id: string;
  worker_name: string;
  total_conversions: number;
  total_points: number;
  has_priority_logistics: boolean;
  rank: number;
}

export interface WorkerStats {
  total_conversions: number;
  total_points: number;
  conversions_7_days: number;
  conversions_30_days: number;
  current_rank: number;
  has_priority_logistics: boolean;
  performance_rank: PerformanceRank;
  progress_to_next_rank: number;
  next_rank_threshold: number;
}

export interface WorkerReward {
  id: string;
  worker_id: string;
  reward_type: 'bonus_points' | 'priority_logistics' | 'special_task';
  points: number;
  description: string | null;
  awarded_by: string | null;
  is_active: boolean;
  created_at: string;
}

// Rank thresholds
const RANK_THRESHOLDS = {
  'Star Performer': 50,
  'Rising Leader': 25,
  'Active Worker': 10,
  'New Recruit': 0,
};

/**
 * Calculate performance rank based on total conversions
 */
function calculatePerformanceRank(conversions: number): PerformanceRank {
  if (conversions >= 50) return 'Star Performer';
  if (conversions >= 25) return 'Rising Leader';
  if (conversions >= 10) return 'Active Worker';
  return 'New Recruit';
}

/**
 * Calculate progress toward next rank
 */
function calculateProgress(conversions: number): { progress: number; nextThreshold: number } {
  if (conversions >= 50) {
    return { progress: 100, nextThreshold: 50 };
  }
  if (conversions >= 25) {
    return { progress: ((conversions - 25) / 25) * 100, nextThreshold: 50 };
  }
  if (conversions >= 10) {
    return { progress: ((conversions - 10) / 15) * 100, nextThreshold: 25 };
  }
  return { progress: (conversions / 10) * 100, nextThreshold: 10 };
}

/**
 * Fetch leaderboard data using RPC
 */
async function fetchLeaderboard(daysBack: number = 7): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_worker_leaderboard', { days_back: daysBack });

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }

  return (data || []).map((entry: any, index: number) => ({
    worker_id: entry.worker_id,
    worker_name: entry.worker_name || 'Unknown',
    total_conversions: Number(entry.total_conversions) || 0,
    total_points: Number(entry.total_points) || 0,
    has_priority_logistics: entry.has_priority_logistics || false,
    rank: index + 1,
  }));
}

/**
 * Fetch worker's own stats using RPC
 */
async function fetchWorkerStats(workerId: string): Promise<WorkerStats | null> {
  const { data, error } = await supabase.rpc('get_worker_stats', { worker_uuid: workerId });

  if (error) {
    console.error('Error fetching worker stats:', error);
    throw error;
  }

  if (!data || data.length === 0) return null;

  const stats = data[0];
  const totalConversions = Number(stats.total_conversions) || 0;
  const { progress, nextThreshold } = calculateProgress(totalConversions);

  return {
    total_conversions: totalConversions,
    total_points: Number(stats.total_points) || 0,
    conversions_7_days: Number(stats.conversions_7_days) || 0,
    conversions_30_days: Number(stats.conversions_30_days) || 0,
    current_rank: Number(stats.current_rank) || 0,
    has_priority_logistics: stats.has_priority_logistics || false,
    performance_rank: calculatePerformanceRank(totalConversions),
    progress_to_next_rank: Math.min(progress, 100),
    next_rank_threshold: nextThreshold,
  };
}

/**
 * Fetch all workers for admin dropdown
 */
async function fetchAllWorkers(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .order('full_name');

  if (error) {
    console.error('Error fetching workers:', error);
    throw error;
  }

  // Filter workers by role
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('role', 'worker');

  const workerIds = new Set((roles || []).map(r => r.user_id));

  return (data || [])
    .filter(p => workerIds.has(p.id))
    .map(p => ({
      id: p.id,
      name: p.full_name || p.username || 'Unknown',
    }));
}

export function useWorkerPerformance() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const isWorker = role === 'worker';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';

  // Leaderboard query (7 days default)
  const { data: leaderboard7Days, isLoading: isLoadingLeaderboard7 } = useQuery({
    queryKey: ['worker-leaderboard', 7],
    queryFn: () => fetchLeaderboard(7),
    enabled: !!user && (isWorker || isAdmin || isManager),
    staleTime: 30000,
  });

  // Leaderboard query (30 days)
  const { data: leaderboard30Days, isLoading: isLoadingLeaderboard30 } = useQuery({
    queryKey: ['worker-leaderboard', 30],
    queryFn: () => fetchLeaderboard(30),
    enabled: !!user && (isWorker || isAdmin || isManager),
    staleTime: 30000,
  });

  // Worker's own stats
  const { data: myStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['worker-stats', user?.id],
    queryFn: () => fetchWorkerStats(user!.id),
    enabled: !!user && isWorker,
    staleTime: 30000,
  });

  // All workers for admin dropdown
  const { data: allWorkers } = useQuery({
    queryKey: ['all-workers'],
    queryFn: fetchAllWorkers,
    enabled: !!user && isAdmin,
    staleTime: 60000,
  });

  // Award reward mutation (admin only)
  const awardRewardMutation = useMutation({
    mutationFn: async ({
      workerId,
      rewardType,
      points,
      description,
    }: {
      workerId: string;
      rewardType: 'bonus_points' | 'priority_logistics' | 'special_task';
      points: number;
      description: string;
    }) => {
      const { error } = await supabase.from('worker_rewards').insert({
        worker_id: workerId,
        reward_type: rewardType,
        points,
        description,
        awarded_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('🎁 Reward awarded successfully!');
      queryClient.invalidateQueries({ queryKey: ['worker-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
    },
    onError: (error) => {
      console.error('Error awarding reward:', error);
      toast.error('Failed to award reward');
    },
  });

  // Revoke priority logistics mutation (admin only)
  const revokePriorityMutation = useMutation({
    mutationFn: async (workerId: string) => {
      const { error } = await supabase
        .from('worker_rewards')
        .update({ is_active: false })
        .eq('worker_id', workerId)
        .eq('reward_type', 'priority_logistics')
        .eq('is_active', true);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Priority logistics revoked');
      queryClient.invalidateQueries({ queryKey: ['worker-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
    },
    onError: (error) => {
      console.error('Error revoking priority:', error);
      toast.error('Failed to revoke priority');
    },
  });

  return {
    // Leaderboard data
    leaderboard7Days: leaderboard7Days || [],
    leaderboard30Days: leaderboard30Days || [],
    isLoadingLeaderboard: isLoadingLeaderboard7 || isLoadingLeaderboard30,

    // Worker stats (for worker view)
    myStats,
    isLoadingStats,

    // All workers (for admin dropdown)
    allWorkers: allWorkers || [],

    // Actions
    awardReward: awardRewardMutation.mutate,
    isAwardingReward: awardRewardMutation.isPending,
    revokePriority: revokePriorityMutation.mutate,

    // Role checks
    isWorker,
    isAdmin,
    isManager,
    canManageRewards: isAdmin,

    // Rank info
    RANK_THRESHOLDS,
  };
}
