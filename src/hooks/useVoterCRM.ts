/**
 * useVoterCRM - Intelligent Voter CRM Hook with Infinite Scroll & Real-time Sync
 * 
 * Features:
 * - Infinite scroll pagination (50 voters per page)
 * - Real-time status updates via Supabase channels
 * - Optimistic UI updates for instant feedback
 * - Ward-based filtering and analytics
 * - Debounced search (300ms)
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

const PAGE_SIZE = 50;

export interface CRMVoter {
  id: string;
  sl_no: number | null;
  name: string;
  name_hindi: string | null;
  phone: string | null;
  ward: number | null;
  booth: string | null;
  caste: string | null;
  gender: string | null;
  age: number | null;
  epic_no: string | null;
  house_no: string | null;
  status: 'support' | 'oppose' | 'neutral';
  has_voted: boolean;
  is_alive: boolean;
  created_at: string | null;
  // Extended fields
  name_english: string | null;
  guardian_name_english: string | null;
  guardian_name_hindi: string | null;
  relation_type: string | null;
  address_1: string | null;
  address_2: string | null;
  address_3: string | null;
  main_man_family: string | null;
  impact_level: string | null;
  voter_status: string | null;
}

export interface WardAnalytics {
  ward: number;
  total: number;
  support: number;
  oppose: number;
  neutral: number;
  voted: number;
  health: 'safe' | 'moderate' | 'weak';
  supportPercentage: number;
}

interface FetchVotersParams {
  pageParam?: number;
  ward: number | null;
  search: string;
}

/**
 * Calculate ward health based on support percentage
 * 🟢 Safe: Support ≥ 50%
 * 🟡 Moderate: Support 30-50%
 * 🔴 Weak: Support < 30%
 */
function calculateWardHealth(supportPercentage: number): 'safe' | 'moderate' | 'weak' {
  if (supportPercentage >= 50) return 'safe';
  if (supportPercentage >= 30) return 'moderate';
  return 'weak';
}

/**
 * Fetch paginated voters from Supabase
 */
async function fetchVoters({ pageParam = 0, ward, search }: FetchVotersParams): Promise<{
  data: CRMVoter[];
  nextPage: number | null;
  total: number;
}> {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('voters')
    .select(`
      id, sl_no, name, name_english, name_hindi, phone, ward, booth, caste, gender, age, 
      epic_no, house_no, status, has_voted, is_alive, created_at,
      guardian_name_english, guardian_name_hindi, relation_type,
      address_1, address_2, address_3, main_man_family, impact_level, voter_status
    `, { count: 'exact' })
    .order('sl_no', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  // Apply ward filter
  if (ward !== null) {
    query = query.eq('ward', ward);
  }

  // Apply search filter (name or phone)
  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching voters:', error);
    throw error;
  }

  const voters: CRMVoter[] = (data || []).map(v => ({
    ...v,
    status: (v.status as 'support' | 'oppose' | 'neutral') || 'neutral',
    has_voted: v.has_voted || false,
    is_alive: v.is_alive !== false, // Default to true if null/undefined
    name_hindi: v.name_hindi || null,
    name_english: v.name_english || null,
    epic_no: v.epic_no || null,
    house_no: v.house_no || null,
    guardian_name_english: v.guardian_name_english || null,
    guardian_name_hindi: v.guardian_name_hindi || null,
    relation_type: v.relation_type || null,
    address_1: v.address_1 || null,
    address_2: v.address_2 || null,
    address_3: v.address_3 || null,
    main_man_family: v.main_man_family || null,
    impact_level: v.impact_level || null,
    voter_status: v.voter_status || null,
  }));

  const totalCount = count || 0;
  const hasMore = from + voters.length < totalCount;

  return {
    data: voters,
    nextPage: hasMore ? pageParam + 1 : null,
    total: totalCount,
  };
}

/**
 * Fetch ward analytics for all wards
 */
async function fetchWardAnalytics(): Promise<WardAnalytics[]> {
  const { data, error } = await supabase
    .from('voters')
    .select('ward, status, has_voted');

  if (error) {
    console.error('Error fetching ward analytics:', error);
    throw error;
  }

  // Group by ward and calculate statistics
  const wardMap = new Map<number, { total: number; support: number; oppose: number; neutral: number; voted: number }>();

  (data || []).forEach(voter => {
    if (voter.ward === null) return;
    
    const current = wardMap.get(voter.ward) || { total: 0, support: 0, oppose: 0, neutral: 0, voted: 0 };
    current.total++;
    
    if (voter.status === 'support') current.support++;
    else if (voter.status === 'oppose') current.oppose++;
    else current.neutral++;
    
    if (voter.has_voted) current.voted++;
    
    wardMap.set(voter.ward, current);
  });

  // Convert to array with health calculation
  const analytics: WardAnalytics[] = [];
  wardMap.forEach((stats, ward) => {
    const supportPercentage = stats.total > 0 ? (stats.support / stats.total) * 100 : 0;
    analytics.push({
      ward,
      ...stats,
      health: calculateWardHealth(supportPercentage),
      supportPercentage: Math.round(supportPercentage),
    });
  });

  return analytics.sort((a, b) => a.ward - b.ward);
}

export function useVoterCRM() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Infinite query for paginated voters
  const {
    data: voterPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingVoters,
    refetch: refetchVoters,
  } = useInfiniteQuery({
    queryKey: ['voters-crm', selectedWard, debouncedSearch],
    queryFn: ({ pageParam }) => fetchVoters({ pageParam, ward: selectedWard, search: debouncedSearch }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Ward analytics query
  const { data: wardAnalytics, isLoading: isLoadingAnalytics } = useInfiniteQuery({
    queryKey: ['ward-analytics'],
    queryFn: fetchWardAnalytics,
    initialPageParam: 0,
    getNextPageParam: () => null,
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });

  // Flatten paginated data
  const voters = voterPages?.pages.flatMap(page => page.data) || [];
  const totalVoters = voterPages?.pages[0]?.total || 0;

  // Real-time subscription for voter updates
  useEffect(() => {
    if (!user) return;

    channelRef.current = supabase
      .channel('voter_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'voters' },
        (payload) => {
          // Update specific voter in cache without refetching
          queryClient.setQueryData(['voters-crm', selectedWard, debouncedSearch], (oldData: any) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((voter: CRMVoter) =>
                  voter.id === payload.new.id
                    ? { ...voter, ...payload.new, status: payload.new.status || 'neutral', has_voted: payload.new.has_voted || false }
                    : voter
                ),
              })),
            };
          });
          
          // Invalidate ward analytics on status change
          if (payload.old?.status !== payload.new?.status) {
            queryClient.invalidateQueries({ queryKey: ['ward-analytics'] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voters' },
        () => {
          // Refetch on new voter
          refetchVoters();
          queryClient.invalidateQueries({ queryKey: ['ward-analytics'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'voters' },
        () => {
          // Refetch on delete
          refetchVoters();
          queryClient.invalidateQueries({ queryKey: ['ward-analytics'] });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, queryClient, selectedWard, debouncedSearch, refetchVoters]);

  /**
   * Update voter status with optimistic UI and conversion tracking
   */
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, previousStatus }: { id: string; status: 'support' | 'oppose' | 'neutral'; previousStatus?: string }) => {
      const { error } = await supabase
        .from('voters')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;

      // Track conversion for points
      const pointsMap: Record<string, number> = {
        'neutral->support': 10,
        'oppose->neutral': 5,
        'oppose->support': 15,
      };
      const conversionKey = `${previousStatus}->${status}`;
      const pointsAwarded = pointsMap[conversionKey] || 0;

      // Only track conversions that earn points
      if (pointsAwarded > 0 && user?.id) {
        const { error: conversionError } = await supabase.from('voter_conversions').insert({
          voter_id: id,
          worker_id: user.id,
          previous_status: previousStatus || 'unknown',
          new_status: status,
          points_awarded: pointsAwarded,
        });
        
        if (conversionError) {
          console.error('Failed to track conversion:', conversionError);
        }
      }

      return { id, status, pointsAwarded };
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['voters-crm', selectedWard, debouncedSearch] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['voters-crm', selectedWard, debouncedSearch]);

      // Optimistically update
      queryClient.setQueryData(['voters-crm', selectedWard, debouncedSearch], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((voter: CRMVoter) =>
              voter.id === id ? { ...voter, status } : voter
            ),
          })),
        };
      });

      // Show optimistic toast
      toast.success(getStatusMessage(status));

      return { previousData };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['voters-crm', selectedWard, debouncedSearch], context.previousData);
      }
      toast.error('स्टेटस अपडेट विफल');
      console.error('Status update error:', error);
    },
    onSuccess: (data) => {
      // Show points earned toast if applicable
      if (data.pointsAwarded > 0) {
        toast.success(`🎉 +${data.pointsAwarded} points earned!`, { duration: 3000 });
      }
    },
    onSettled: () => {
      // Invalidate ward analytics and leaderboard
      queryClient.invalidateQueries({ queryKey: ['ward-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['worker-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['worker-stats'] });
    },
  });

  /**
   * Mark voter as voted with optimistic UI
   */
  const markVotedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('voters')
        .update({ has_voted: true })
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['voters-crm', selectedWard, debouncedSearch] });
      const previousData = queryClient.getQueryData(['voters-crm', selectedWard, debouncedSearch]);

      queryClient.setQueryData(['voters-crm', selectedWard, debouncedSearch], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((voter: CRMVoter) =>
              voter.id === id ? { ...voter, has_voted: true } : voter
            ),
          })),
        };
      });

      toast.success('वोट दर्ज किया गया');
      return { previousData };
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['voters-crm', selectedWard, debouncedSearch], context.previousData);
      }
      toast.error('वोट दर्ज करने में विफल');
      console.error('Mark voted error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ward-analytics'] });
    },
  });

  /**
   * Delete voter (admin only)
   */
  const deleteVoterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('voters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('मतदाता हटाया गया');
      refetchVoters();
      queryClient.invalidateQueries({ queryKey: ['ward-analytics'] });
    },
    onError: (error) => {
      toast.error('हटाने में विफल');
      console.error('Delete voter error:', error);
    },
  });

  const updateVoterStatus = useCallback((id: string, status: 'support' | 'oppose' | 'neutral', previousStatus?: string) => {
    updateStatusMutation.mutate({ id, status, previousStatus });
  }, [updateStatusMutation]);

  const markVoterVoted = useCallback((id: string) => {
    markVotedMutation.mutate(id);
  }, [markVotedMutation]);

  const deleteVoter = useCallback((id: string) => {
    if (role !== 'admin') {
      toast.error('केवल एडमिन ही हटा सकते हैं');
      return;
    }
    deleteVoterMutation.mutate(id);
  }, [deleteVoterMutation, role]);

  // Computed analytics for selected ward
  const currentWardAnalytics = wardAnalytics?.pages[0]?.find(
    (w: WardAnalytics) => w.ward === selectedWard
  );

  const allWardsAnalytics = wardAnalytics?.pages[0] || [];

  // Total counts across all wards
  const totalStats = allWardsAnalytics.reduce(
    (acc, ward) => ({
      total: acc.total + ward.total,
      support: acc.support + ward.support,
      oppose: acc.oppose + ward.oppose,
      neutral: acc.neutral + ward.neutral,
      voted: acc.voted + ward.voted,
    }),
    { total: 0, support: 0, oppose: 0, neutral: 0, voted: 0 }
  );

  return {
    // Voter data
    voters,
    totalVoters,
    isLoadingVoters,
    
    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    
    // Filters
    selectedWard,
    setSelectedWard,
    searchQuery,
    setSearchQuery,
    
    // Actions
    updateVoterStatus,
    markVoterVoted,
    deleteVoter,
    
    // Analytics
    wardAnalytics: allWardsAnalytics,
    currentWardAnalytics,
    totalStats,
    isLoadingAnalytics,
    
    // Auth
    role,
    isAdmin: role === 'admin',
  };
}

function getStatusMessage(status: 'support' | 'oppose' | 'neutral'): string {
  switch (status) {
    case 'support': return '✅ समर्थक में बदला';
    case 'oppose': return '❌ विरोधी में बदला';
    case 'neutral': return '⚪ तटस्थ में बदला';
  }
}
