import React, { useState } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import {
  MasterStaff,
  WorkspaceAccessLevel,
  ModuleAccess,
  DEFAULT_MODULE_ACCESS_MAP,
} from '@/types/master';
import { MasterEntity } from '@/types/samiti';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ShieldCheck,
  Eye,
  Edit,
  Shield,
  SlidersHorizontal,
  Lock,
  Building2,
  FileSpreadsheet,
  Receipt,
  Users2,
  BarChart3,
  Download,
  Vote,
  Flame,
  Tent,
} from 'lucide-react';

interface AccessControlMatrixViewProps {
  initialSelectedStaffId?: string;
  searchQuery?: string;
}

const ACCESS_CONFIG: Record<
  WorkspaceAccessLevel,
  { label: string; color: string; icon: React.ReactNode; desc: string }
> = {
  full_control: {
    label: 'Full Access',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
    desc: 'Full editing, record creation, vouchers, and exports',
  },
  editor: {
    label: 'Editor',
    color: 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
    icon: <Edit className="w-3.5 h-3.5 text-saffron-dark" />,
    desc: 'Voter & transaction data entry, settings restricted',
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100',
    icon: <Eye className="w-3.5 h-3.5 text-navy" />,
    desc: 'Read-only access to ledgers, reports, and lists',
  },
  collector: {
    label: 'Donation Only',
    color: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100',
    icon: <Receipt className="w-3.5 h-3.5 text-amber-600" />,
    desc: 'Only add & view donations in this unit; all dashboards & expenses hidden',
  },
  no_access: {
    label: 'No Access',
    color: 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200',
    icon: <Lock className="w-3.5 h-3.5 text-slate-400" />,
    desc: 'Workspace hidden from this member',
  },
};

export const AccessControlMatrixView: React.FC<AccessControlMatrixViewProps> = ({
  initialSelectedStaffId,
  searchQuery = '',
}) => {
  const { staffList, entities, updateStaffPermission, grantAllWorkspaces } = useSamiti();

  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>(
    initialSelectedStaffId || 'all'
  );

  // Module detail dialog state
  const [moduleModalData, setModuleModalData] = useState<{
    staff: MasterStaff;
    workspace: MasterEntity;
    modules: ModuleAccess;
    accessLevel: WorkspaceAccessLevel;
  } | null>(null);

  const handleLevelChange = (
    staffId: string,
    workspaceId: string,
    newLevel: WorkspaceAccessLevel
  ) => {
    updateStaffPermission(staffId, workspaceId, newLevel);
  };

  const handleOpenModuleModal = (staff: MasterStaff, ws: MasterEntity) => {
    const currentPerm = staff.workspacePermissions[ws.id];
    const level = currentPerm?.accessLevel || 'no_access';
    const modules = currentPerm?.modules || { ...DEFAULT_MODULE_ACCESS_MAP[level] };

    setModuleModalData({
      staff,
      workspace: ws,
      modules,
      accessLevel: level,
    });
  };

  const handleSaveModules = () => {
    if (!moduleModalData) return;
    const { staff, workspace, accessLevel, modules } = moduleModalData;
    updateStaffPermission(staff.id, workspace.id, accessLevel, modules);
    setModuleModalData(null);
  };

  // Filter staff
  const filteredStaff = staffList.filter(staff => {
    const matchesFilter =
      selectedStaffFilter === 'all' || staff.id === selectedStaffFilter;
    const matchesSearch =
      !searchQuery ||
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.includes(searchQuery) ||
      staff.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Legend & Guide Strip with KPI Card styling */}
      <div className="kpi-card shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Access Control Matrix
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure role and data access levels per workspace
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-navy/10 text-navy border border-navy/20 self-start sm:self-auto">
            Security: Active
          </span>
        </div>

        {/* 4 Access Level Chips with Descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
          {Object.entries(ACCESS_CONFIG).map(([key, conf]) => (
            <div
              key={key}
              className="p-2.5 rounded-xl border border-border/50 bg-slate-50/70 space-y-0.5 hover:bg-white transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                {conf.icon}
                <span>{conf.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">{conf.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700 shrink-0">Member:</span>
          <Select
            value={selectedStaffFilter}
            onValueChange={v => setSelectedStaffFilter(v)}
          >
            <SelectTrigger className="h-8 text-xs bg-white border-slate-200 w-full sm:w-60 rounded-xl shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members ({staffList.length})</SelectItem>
              {staffList.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.name} ({s.designation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick batch action for single staff */}
        {selectedStaffFilter !== 'all' && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => grantAllWorkspaces(selectedStaffFilter, 'full_control')}
              className="text-[11px] h-7 px-2.5 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Grant Full Access to All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => grantAllWorkspaces(selectedStaffFilter, 'viewer')}
              className="text-[11px] h-7 px-2.5 rounded-lg border-blue-200 text-navy hover:bg-blue-50"
            >
              Grant View Only to All
            </Button>
          </div>
        )}
      </div>

      {/* MATRIX TABLE */}
      <div className="glass-panel shadow-sm overflow-hidden border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-navy to-navy-dark text-white text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 min-w-[200px] border-r border-white/10">
                  Team Member
                </th>
                {entities.map(ent => (
                  <th
                    key={ent.id}
                    className="py-3 px-4 min-w-[200px] text-center border-r border-white/10 last:border-0"
                  >
                    <div className="truncate font-bold flex items-center justify-center gap-1.5">
                      {ent.type === 'election' ? (
                        <Vote className="w-3.5 h-3.5 text-saffron shrink-0" />
                      ) : ent.type === 'festival_samiti' ? (
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      )}
                      <span className="truncate">{ent.name}</span>
                    </div>
                    <span className="text-[10px] font-normal text-white/70 block truncate mt-0.5">
                      {ent.location || 'Active'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs bg-white/80">
              {filteredStaff.map(staff => (
                <tr key={staff.id} className="hover:bg-amber-50/30 transition-colors">
                  {/* Staff Info Column */}
                  <td className="py-3 px-4 border-r border-slate-100 bg-white">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${
                          staff.primaryRole === 'manager'
                            ? 'bg-gradient-to-br from-saffron to-saffron-dark'
                            : staff.primaryRole === 'admin'
                            ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                            : 'bg-gradient-to-br from-navy to-navy-dark'
                        }`}
                      >
                        {staff.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {staff.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {staff.designation} • {staff.phone}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Workspace Permission Cells */}
                  {entities.map(ent => {
                    const currentPerm = staff.workspacePermissions[ent.id];
                    const level: WorkspaceAccessLevel = currentPerm?.accessLevel || 'no_access';
                    const conf = ACCESS_CONFIG[level];

                    return (
                      <td
                        key={ent.id}
                        className="py-2.5 px-3 text-center border-r border-slate-100 last:border-0 align-middle"
                      >
                        <div className="flex flex-col items-center gap-1 max-w-[180px] mx-auto">
                          {/* Access Level Selector */}
                          <Select
                            value={level}
                            onValueChange={(val: WorkspaceAccessLevel) =>
                              handleLevelChange(staff.id, ent.id, val)
                            }
                          >
                            <SelectTrigger
                              className={`h-7 text-[11px] font-semibold border rounded-lg shadow-none truncate transition-colors ${conf.color}`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {conf.icon}
                                <span className="truncate">{conf.label}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_control" className="text-xs font-bold text-emerald-700">
                                👑 Full Access
                              </SelectItem>
                              <SelectItem value="editor" className="text-xs font-bold text-amber-700">
                                ✏️ Editor
                              </SelectItem>
                              <SelectItem value="collector" className="text-xs font-bold text-amber-800">
                                🎟️ Donation Only (चंदा संग्रह)
                              </SelectItem>
                              <SelectItem value="viewer" className="text-xs font-bold text-blue-700">
                                👁️ Viewer
                              </SelectItem>
                              <SelectItem value="no_access" className="text-xs font-bold text-slate-500">
                                🚫 No Access
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Fine-grained Module config trigger */}
                          {level !== 'no_access' && (
                            <button
                              onClick={() => handleOpenModuleModal(staff, ent)}
                              className="text-[10px] text-muted-foreground hover:text-saffron-dark font-medium flex items-center gap-1 transition-colors"
                              title="Configure module access"
                            >
                              <SlidersHorizontal className="w-2.5 h-2.5" />
                              <span>Modules</span>
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRANULAR MODULE ACCESS MODAL */}
      <Dialog open={!!moduleModalData} onOpenChange={open => !open && setModuleModalData(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-navy/10 text-navy">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <span>Module Permissions</span>
            </DialogTitle>
          </DialogHeader>

          {moduleModalData && (
            <div className="space-y-3.5 mt-2 text-xs">
              <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-0.5">
                <p className="font-bold text-slate-900">
                  Member: {moduleModalData.staff.name} ({moduleModalData.staff.designation})
                </p>
                <p className="text-muted-foreground">
                  Workspace: {moduleModalData.workspace.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 block">
                  Allowed Modules:
                </Label>

                <div className="space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-white">
                  {[
                    {
                      key: 'votersCRM' as keyof ModuleAccess,
                      label: 'Voter CRM & Surveys',
                      desc: 'Voter database, support status, and field surveys',
                      icon: <Users2 className="w-4 h-4 text-saffron" />,
                    },
                    {
                      key: 'donationsLedger' as keyof ModuleAccess,
                      label: 'Funds & Collections',
                      desc: 'Receipts, donor records, and Excel data grid',
                      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
                    },
                    {
                      key: 'expenses' as keyof ModuleAccess,
                      label: 'Expense Manager',
                      desc: 'Expense vouchers, bills, and payment entries',
                      icon: <Receipt className="w-4 h-4 text-amber-600" />,
                    },
                    {
                      key: 'pandalPujaKharcha' as keyof ModuleAccess,
                      label: 'Pandal & Puja Kharcha (पंडाल एवं पूजा व्यय)',
                      desc: 'Pandal construction, decoration, and puja expense section of the Durga Puja unit',
                      icon: <Tent className="w-4 h-4 text-rose-600" />,
                    },
                    {
                      key: 'analytics' as keyof ModuleAccess,
                      label: 'Reports & Analytics',
                      desc: 'Financial charts and voter intelligence',
                      icon: <BarChart3 className="w-4 h-4 text-navy" />,
                    },
                    {
                      key: 'karyakartaMgmt' as keyof ModuleAccess,
                      label: 'Team Coordination',
                      desc: 'Manage local volunteers and ground teams',
                      icon: <Shield className="w-4 h-4 text-cyan-600" />,
                    },
                    {
                      key: 'exportData' as keyof ModuleAccess,
                      label: 'Export Data',
                      desc: 'Download reports as Excel or PDF',
                      icon: <Download className="w-4 h-4 text-purple-600" />,
                    },
                  ].map(item => {
                    const isChecked = !!moduleModalData.modules[item.key];
                    return (
                      <label
                        key={item.key}
                        className="flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 shrink-0">{item.icon}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const updated = {
                              ...moduleModalData.modules,
                              [item.key]: e.target.checked,
                            };
                            setModuleModalData(prev =>
                              prev ? { ...prev, modules: updated } : null
                            );
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-saffron focus:ring-saffron"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModuleModalData(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveModules}
                  className="btn-saffron rounded-xl font-bold"
                >
                  Save Permissions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
