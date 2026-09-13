import React from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Wallet,
  Users2,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  PieChart,
  DollarSign,
  Vote,
  Flame,
} from 'lucide-react';

interface MasterAnalyticsViewProps {
  onOpenWorkspace: (id: string) => void;
}

export const MasterAnalyticsView: React.FC<MasterAnalyticsViewProps> = ({ onOpenWorkspace }) => {
  const { entities, events, summary, staffList, mainWorkspaceId } = useSamiti();

  // Aggregate total target budget
  const totalTargetBudget = events.reduce((sum, ev) => sum + (ev.targetBudget || 0), 0);

  // Group entities by type
  const countsByType = {
    election: entities.filter(e => e.type === 'election').length,
    festival_samiti: entities.filter(e => e.type === 'festival_samiti').length,
    business: entities.filter(e => e.type === 'business').length,
    rwa: entities.filter(e => e.type === 'rwa' || e.type === 'ngo').length,
  };

  return (
    <div className="space-y-5">
      {/* 4 Consolidated Executive Cards with Tricolor Top Bar Accent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
              Target Budget
            </span>
            <DollarSign className="w-4 h-4 text-saffron" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
            ₹{totalTargetBudget.toLocaleString('en-IN')}
          </p>
          <span className="text-[13px] text-muted-foreground mt-1 block">
            {events.length} Active Campaigns
          </span>
        </div>

        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-emerald-800 uppercase tracking-wider">
              Total Received
            </span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 font-mono">
            ₹{summary.totalReceived.toLocaleString('en-IN')}
          </p>
          <span className="text-[13px] text-emerald-700 font-semibold mt-1 block">
            Cash: ₹{summary.cashReceived.toLocaleString('en-IN')} • UPI: ₹{summary.onlineReceived.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-navy uppercase tracking-wider">
              Net Surplus
            </span>
            <TrendingUp className="w-4 h-4 text-navy" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-navy mt-1 font-mono">
            ₹{summary.netSurplus.toLocaleString('en-IN')}
          </p>
          <span className="text-[13px] text-muted-foreground mt-1 block">
            Expenses: ₹{summary.totalExpenses.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-purple-800 uppercase tracking-wider">
              Total Cadre
            </span>
            <Users2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-900 mt-1 font-mono">
            {staffList.length}
          </p>
          <span className="text-[13px] text-purple-700 font-semibold mt-1 block">
            Active across all units
          </span>
        </div>
      </div>

      {/* Workspace Type Distribution Breakdown */}
      <div className="glass-panel p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-saffron/10 text-saffron">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Unit Breakdown
            </h3>
          </div>
          <span className="text-xs font-semibold text-muted-foreground font-mono">
            {entities.length} Units Total
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-50/90 to-amber-50/70 border border-saffron/30 rounded-xl space-y-0.5">
            <span className="text-xs text-saffron-dark font-bold flex items-center gap-1">
              <Vote className="w-3.5 h-3.5 text-saffron" />
              War Rooms
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono">{countsByType.election}</p>
            <p className="text-[12px] text-muted-foreground">Election campaigns</p>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-0.5">
            <span className="text-xs text-amber-800 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              Cultural Samiti
            </span>
            <p className="text-2xl font-black text-amber-950 font-mono">{countsByType.festival_samiti}</p>
            <p className="text-[12px] text-muted-foreground">Festivals & trusts</p>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-0.5">
            <span className="text-xs text-navy font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-navy" />
              Business
            </span>
            <p className="text-2xl font-black text-navy-dark font-mono">{countsByType.business}</p>
            <p className="text-[12px] text-muted-foreground">Trade & commerce</p>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-0.5">
            <span className="text-xs text-emerald-800 font-bold">🏛️ Society / NGO</span>
            <p className="text-2xl font-black text-emerald-950 font-mono">{countsByType.rwa}</p>
            <p className="text-[12px] text-muted-foreground">Community & RWA</p>
          </div>
        </div>
      </div>

      {/* Individual Workspaces Performance Table */}
      <div className="glass-panel shadow-sm overflow-hidden border border-border/60">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-navy/10 text-navy">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Workspace Overview
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-navy to-navy-dark text-white font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Unit Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Campaign Title</th>
                <th className="py-3 px-4 text-right">Target Budget</th>
                <th className="py-3 px-4 text-center">Cadre</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/80">
              {entities.map(ent => {
                const entEvent = events.find(e => e.entityId === ent.id);
                const isMain = ent.id === mainWorkspaceId;
                const isElection = ent.type === 'election';
                const assignedStaffCount = staffList.filter(
                  s => s.workspacePermissions[ent.id] && s.workspacePermissions[ent.id].accessLevel !== 'no_access'
                ).length;

                return (
                  <tr key={ent.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>
                          {isElection ? (
                            <Vote className="w-4 h-4 text-saffron inline" />
                          ) : ent.type === 'festival_samiti' ? (
                            <Flame className="w-4 h-4 text-amber-500 inline" />
                          ) : (
                            <Building2 className="w-4 h-4 text-navy inline" />
                          )}
                        </span>
                        <span className="truncate max-w-[180px]">{ent.name}</span>
                        {isMain && (
                          <Badge className="bg-saffron text-white font-bold text-[11px] px-1.5 py-0 rounded-full border-none">
                            Main
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[12px] capitalize ${
                          isElection
                            ? 'bg-saffron/10 text-saffron-dark border-saffron/30'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isElection ? 'War Room' : ent.type.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-slate-700 truncate max-w-[180px]">
                      {entEvent?.title || 'Annual Campaign 2026'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{(entEvent?.targetBudget || 300000).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary" className="text-[12px] font-mono">
                        {assignedStaffCount} members
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Active
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => onOpenWorkspace(ent.id)}
                        className={`text-xs h-7 px-2.5 rounded-lg font-bold transition-all ${
                          isElection
                            ? 'btn-saffron shadow-2xs'
                            : 'bg-slate-100 hover:bg-navy hover:text-white text-slate-800'
                        }`}
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
