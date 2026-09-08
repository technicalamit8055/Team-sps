/**
 * VoterCRM - Intelligent Voter CRM & Ward Analytics Engine
 * 
 * Features:
 * - Data Table (Desktop) / Expandable Cards (Mobile)
 * - L/D (Living/Deceased) filtering
 * - Ward-based filtering
 * - Voter Profile Sheet
 * - Infinite scroll pagination
 * - Real-time status sync
 * - Glassmorphism design with Saffron/Navy theme
 */
import React, { useState, useRef, useEffect } from 'react';
import { useVictory } from '@/contexts/VictoryContext';
import { useVoterCRM, type CRMVoter } from '@/hooks/useVoterCRM';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, RefreshCw, X, ChevronDown, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoterDataTable } from './VoterDataTable';
import { VoterMobileCard } from './VoterMobileCard';
import { VoterProfileSheet } from './VoterProfileSheet';
import { FilterBar } from './FilterBar';
import { WardKPICard } from './WardKPICard';
import { TotalStatsBar } from './TotalStatsBar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export const VoterCRM: React.FC = () => {
  const { data, pollingMode, setPollingMode } = useVictory();
  const isMobile = useIsMobile();
  const {
    voters,
    totalVoters,
    isLoadingVoters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    selectedWard,
    setSelectedWard,
    searchQuery,
    setSearchQuery,
    updateVoterStatus,
    markVoterVoted,
    deleteVoter,
    wardAnalytics,
    totalStats,
    isLoadingAnalytics,
    isAdmin,
  } = useVoterCRM();

  const [selectedVoter, setSelectedVoter] = useState<CRMVoter | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [livingFilter, setLivingFilter] = useState<'all' | 'living' | 'deceased'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Get unique wards from analytics
  const availableWards = wardAnalytics.map(w => w.ward).sort((a, b) => a - b);

  // Filter voters by L/D status (client-side for now)
  const filteredVoters = voters.filter(voter => {
    if (livingFilter === 'all') return true;
    if (livingFilter === 'living') return voter.is_alive !== false;
    if (livingFilter === 'deceased') return voter.is_alive === false;
    return true;
  });

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleVoterClick = (voter: CRMVoter) => {
    setSelectedVoter(voter);
    setProfileSheetOpen(true);
  };

  const handleStatusChange = (status: 'support' | 'oppose' | 'neutral') => {
    if (selectedVoter) {
      updateVoterStatus(selectedVoter.id, status);
      setSelectedVoter(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleMarkVoted = () => {
    if (selectedVoter) {
      markVoterVoted(selectedVoter.id);
      setSelectedVoter(prev => prev ? { ...prev, has_voted: true } : null);
    }
  };

  // Loading skeleton
  if (isLoadingVoters && voters.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-40 rounded-xl flex-shrink-0" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text-navy">Voter CRM</h1>
          <p className="text-muted-foreground">
            {totalVoters.toLocaleString('hi-IN')} मतदाता • Narayanpur Panchayat
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle (Desktop only) */}
          {!isMobile && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                className={viewMode === 'table' ? 'bg-secondary' : ''}
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                className={viewMode === 'cards' ? 'bg-secondary' : ''}
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          )}
          <span className="text-sm text-muted-foreground">मतदान मोड</span>
          <Switch checked={pollingMode} onCheckedChange={setPollingMode} />
          {pollingMode && (
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full animate-pulse">
              🗳️ Live
            </span>
          )}
        </div>
      </div>

      {/* Total Stats Bar */}
      <TotalStatsBar {...totalStats} />

      {/* Ward KPI Scroll */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground">वार्ड एनालिटिक्स</h3>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {isLoadingAnalytics ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-40 rounded-xl flex-shrink-0" />
              ))
            ) : (
              wardAnalytics.map((ward) => (
                <WardKPICard
                  key={ward.ward}
                  analytics={ward}
                  isSelected={selectedWard === ward.ward}
                  onClick={() => setSelectedWard(selectedWard === ward.ward ? null : ward.ward)}
                />
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Filter Bar - Sticky */}
      <FilterBar
        wards={availableWards}
        selectedWard={selectedWard}
        onWardChange={setSelectedWard}
        livingFilter={livingFilter}
        onLivingFilterChange={setLivingFilter}
        totalFiltered={filteredVoters.length}
        totalAll={totalVoters}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="नाम, मोबाइल या EPIC से खोजें..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 glass-card border-secondary/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredVoters.length} / {totalVoters.toLocaleString('hi-IN')} परिणाम
          {selectedWard && ` • Ward ${selectedWard}`}
          {livingFilter !== 'all' && ` • ${livingFilter === 'living' ? 'जीवित' : 'स्वर्गीय'}`}
        </span>
        {hasNextPage && (
          <span className="flex items-center gap-1">
            <ChevronDown className="w-4 h-4 animate-bounce" />
            और लोड करें
          </span>
        )}
      </div>

      {/* Voter List */}
      {filteredVoters.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground glass-panel">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>कोई मतदाता नहीं मिला</p>
          <p className="text-sm">खोज या फ़िल्टर बदलें</p>
        </div>
      ) : (
        <>
          {/* Desktop: Data Table or Cards */}
          {!isMobile && viewMode === 'table' ? (
            <VoterDataTable
              voters={filteredVoters}
              onRowClick={handleVoterClick}
              isLoading={isLoadingVoters}
            />
          ) : (
            /* Mobile: Always Cards, Desktop: Cards if selected */
            <div className="space-y-3">
              {filteredVoters.map((voter) => (
                <VoterMobileCard
                  key={voter.id}
                  voter={voter}
                  onViewProfile={() => handleVoterClick(voter)}
                  onStatusChange={(status) => updateVoterStatus(voter.id, status)}
                  onMarkVoted={() => markVoterVoted(voter.id)}
                  candidateName={data.settings.candidateName}
                  pollingMode={pollingMode}
                />
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-4 text-center">
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>और लोड हो रहा है...</span>
              </div>
            )}
            {!hasNextPage && filteredVoters.length > 0 && (
              <p className="text-sm text-muted-foreground">सभी मतदाता दिखाए गए</p>
            )}
          </div>
        </>
      )}

      {/* Voter Profile Sheet */}
      <VoterProfileSheet
        voter={selectedVoter}
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        onStatusChange={handleStatusChange}
        onMarkVoted={handleMarkVoted}
        candidateName={data.settings.candidateName}
        pollingMode={pollingMode}
      />
    </div>
  );
};

export default VoterCRM;