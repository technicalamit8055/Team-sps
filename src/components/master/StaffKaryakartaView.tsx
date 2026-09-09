import React, { useState } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { MasterStaff, MasterRole, WorkspaceAccessLevel, DEFAULT_MODULE_ACCESS_MAP } from '@/types/master';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users2,
  UserPlus,
  Search,
  Phone,
  MessageSquare,
  Shield,
  Trash2,
  Edit,
  KeyRound,
  Star,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface StaffKaryakartaViewProps {
  onNavigateToPermissions: (staffId?: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  searchQuery?: string;
}

const ROLE_CONFIG: Record<
  MasterRole,
  { label: string; color: string; badgeBg: string }
> = {
  admin: {
    label: 'Admin',
    color: 'bg-rose-500',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  manager: {
    label: 'Incharge',
    color: 'bg-saffron',
    badgeBg: 'bg-saffron/10 text-saffron-dark border-saffron/30',
  },
  accountant: {
    label: 'Treasurer',
    color: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  karyakarta: {
    label: 'Field Worker',
    color: 'bg-navy',
    badgeBg: 'bg-navy/10 text-navy border-navy/20',
  },
  observer: {
    label: 'Observer',
    color: 'bg-purple-500',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

const ACCESS_LEVEL_LABELS: Record<
  WorkspaceAccessLevel,
  { label: string; badgeColor: string }
> = {
  full_control: {
    label: 'Full Access',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  },
  editor: {
    label: 'Editor',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-300',
  },
  viewer: {
    label: 'Viewer',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-300',
  },
  no_access: {
    label: 'No Access',
    badgeColor: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};

export const StaffKaryakartaView: React.FC<StaffKaryakartaViewProps> = ({
  onNavigateToPermissions,
  isCreateModalOpen,
  setIsCreateModalOpen,
  searchQuery = '',
}) => {
  const { staffList, addStaff, updateStaff, deleteStaff, entities } = useSamiti();

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [editingStaff, setEditingStaff] = useState<MasterStaff | null>(null);

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newRole, setNewRole] = useState<MasterRole>('karyakarta');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [defaultAccessLevel, setDefaultAccessLevel] = useState<WorkspaceAccessLevel>('editor');

  // Edit staff form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRole, setEditRole] = useState<MasterRole>('karyakarta');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Please enter name and phone number');
      return;
    }

    const username = `${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(Math.random() * 100)}`;
    const workspacePermissions: MasterStaff['workspacePermissions'] = {};

    selectedWorkspaceIds.forEach(wsId => {
      workspacePermissions[wsId] = {
        workspaceId: wsId,
        accessLevel: defaultAccessLevel,
        modules: { ...DEFAULT_MODULE_ACCESS_MAP[defaultAccessLevel] },
      };
    });

    const colors = [
      'bg-saffron',
      'bg-navy',
      'bg-emerald-600',
      'bg-indigo-600',
      'bg-purple-600',
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    addStaff({
      name: newName.trim(),
      phone: newPhone.trim(),
      username,
      designation: newDesignation.trim() || ROLE_CONFIG[newRole].label,
      primaryRole: newRole,
      status: 'active',
      avatarColor,
      workspacePermissions,
    });

    setNewName('');
    setNewPhone('');
    setNewDesignation('');
    setSelectedWorkspaceIds([]);
    setIsCreateModalOpen(false);
  };

  const handleOpenEdit = (staff: MasterStaff) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditPhone(staff.phone);
    setEditDesignation(staff.designation);
    setEditRole(staff.primaryRole);
    setEditStatus(staff.status);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName.trim()) return;

    updateStaff(editingStaff.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      designation: editDesignation.trim(),
      primaryRole: editRole,
      status: editStatus,
    });

    setEditingStaff(null);
  };

  const effectiveSearch = searchQuery || localSearch;

  const filteredStaff = staffList.filter(staff => {
    const matchesRole = roleFilter === 'all' || staff.primaryRole === roleFilter;
    const matchesSearch =
      !effectiveSearch ||
      staff.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      staff.phone.includes(effectiveSearch) ||
      staff.designation.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      staff.username.toLowerCase().includes(effectiveSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const totalActive = staffList.filter(s => s.status === 'active').length;
  const totalAdmins = staffList.filter(s => s.primaryRole === 'admin' || s.primaryRole === 'manager').length;
  const totalKaryakartas = staffList.filter(s => s.primaryRole === 'karyakarta').length;

  return (
    <div className="space-y-5">
      {/* Metric Cards with Tricolor Top Bar Accent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Cadre
            </span>
            <Users2 className="w-4 h-4 text-saffron" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
            {staffList.length}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-700 font-semibold">
              {totalActive} Active Members
            </span>
          </div>
        </div>

        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Incharges & Admins
            </span>
            <Star className="w-4 h-4 fill-saffron text-saffron" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-saffron-dark mt-1 font-mono">
            {totalAdmins}
          </p>
          <span className="text-[11px] text-muted-foreground block mt-1">
            Command & Oversight
          </span>
        </div>

        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-navy uppercase tracking-wider">
              Field Workers
            </span>
            <UserCheck className="w-4 h-4 text-navy" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-navy mt-1 font-mono">
            {totalKaryakartas}
          </p>
          <span className="text-[11px] text-muted-foreground block mt-1">
            Ground & Booth Team
          </span>
        </div>

        <div className="kpi-card shadow-sm bg-gradient-to-br from-purple-50/60 to-indigo-50/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
              Access Matrix
            </span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-900 mt-1 font-mono">
            {entities.length} Units
          </p>
          <button
            onClick={() => onNavigateToPermissions()}
            className="text-[11px] text-purple-700 hover:text-purple-900 font-bold underline mt-1 block transition-colors"
          >
            Configure Matrix →
          </button>
        </div>
      </div>

      {/* Role Filters & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Members' },
            { id: 'manager', label: '⭐ Incharges' },
            { id: 'admin', label: '🛡️ Admins' },
            { id: 'karyakarta', label: '👥 Field Workers' },
            { id: 'accountant', label: '💰 Treasurers' },
          ].map(tab => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'btn-saffron shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-navy border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-saffron text-xs h-8 px-3 rounded-xl shadow-xs flex items-center gap-1.5 font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Member</span>
          </Button>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredStaff.map(staff => {
          const roleConf = ROLE_CONFIG[staff.primaryRole] || ROLE_CONFIG.karyakarta;
          const assignedCount = Object.keys(staff.workspacePermissions).length;

          return (
            <div
              key={staff.id}
              className="glass-panel p-4 sm:p-5 hover:border-saffron/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header: Avatar, Name, Role Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${
                        staff.primaryRole === 'manager'
                          ? 'bg-gradient-to-br from-saffron to-saffron-dark ring-2 ring-saffron/30'
                          : staff.primaryRole === 'admin'
                          ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                          : 'bg-gradient-to-br from-navy to-navy-dark'
                      }`}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight group-hover:text-navy truncate">
                        {staff.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                        {staff.designation || roleConf.label}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className={`text-[10px] font-semibold shrink-0 ${roleConf.badgeBg}`}>
                    {roleConf.label}
                  </Badge>
                </div>

                {/* Contact Strip */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-saffron" />
                    <span>{staff.phone}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`tel:${staff.phone}`}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                      title="Call"
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://wa.me/91${staff.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Assigned Workspaces Section */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Assigned Units ({assignedCount})</span>
                    <button
                      onClick={() => onNavigateToPermissions(staff.id)}
                      className="text-saffron-dark hover:text-saffron font-bold flex items-center gap-1 transition-colors"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Permissions</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {assignedCount === 0 ? (
                      <span className="text-[11px] text-muted-foreground italic">
                        No units assigned
                      </span>
                    ) : (
                      Object.entries(staff.workspacePermissions).map(([wsId, perm]) => {
                        const entity = entities.find(e => e.id === wsId);
                        const lvlInfo =
                          ACCESS_LEVEL_LABELS[perm.accessLevel] ||
                          ACCESS_LEVEL_LABELS.viewer;
                        if (!entity) return null;
                        return (
                          <span
                            key={wsId}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${lvlInfo.badgeColor}`}
                            title={`${entity.name} (${lvlInfo.label})`}
                          >
                            <span className="truncate max-w-[110px]">{entity.name}</span>
                            <span className="text-[8px] opacity-75 font-mono">
                              • {lvlInfo.label}
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      staff.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-muted-foreground capitalize">
                    {staff.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(staff)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-navy hover:bg-slate-100 rounded-lg"
                    title="Edit Member"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove ${staff.name}?`)) {
                        deleteStaff(staff.id);
                      }
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Remove Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE STAFF MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-saffron/10 text-saffron">
                <UserPlus className="w-5 h-5" />
              </div>
              <span>Add Team Member</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3 mt-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
              <Input
                placeholder="e.g. Rajesh Sharma"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
              <Input
                placeholder="9876543210"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                required
                className="mt-1 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Role</Label>
                <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                  <SelectTrigger className="mt-1 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">⭐ Incharge</SelectItem>
                    <SelectItem value="karyakarta">👥 Field Worker</SelectItem>
                    <SelectItem value="accountant">💰 Treasurer</SelectItem>
                    <SelectItem value="admin">🛡️ Admin</SelectItem>
                    <SelectItem value="observer">👁️ Observer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Designation</Label>
                <Input
                  placeholder="e.g. Ward Coordinator"
                  value={newDesignation}
                  onChange={e => setNewDesignation(e.target.value)}
                  className="mt-1 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Default Access Level</Label>
              <Select
                value={defaultAccessLevel}
                onValueChange={(v: any) => setDefaultAccessLevel(v)}
              >
                <SelectTrigger className="mt-1 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor (Data Entry)</SelectItem>
                  <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                  <SelectItem value="full_control">Full Access (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select Workspaces */}
            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Assign Units ({selectedWorkspaceIds.length} selected)
              </Label>
              <div className="mt-1 border border-slate-200 rounded-xl p-2 space-y-1 max-h-32 overflow-y-auto bg-slate-50/50">
                {entities.map(ent => {
                  const isChecked = selectedWorkspaceIds.includes(ent.id);
                  return (
                    <label
                      key={ent.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded-lg transition-colors text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedWorkspaceIds(prev => [...prev, ent.id]);
                          } else {
                            setSelectedWorkspaceIds(prev => prev.filter(id => id !== ent.id));
                          }
                        }}
                        className="rounded text-saffron focus:ring-saffron"
                      />
                      <span className="truncate text-slate-800">{ent.name}</span>
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
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="btn-saffron rounded-xl font-bold">
                Add Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT STAFF MODAL */}
      <Dialog open={!!editingStaff} onOpenChange={open => !open && setEditingStaff(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-navy/10 text-navy">
                <Edit className="w-4 h-4" />
              </div>
              <span>Edit Member Details</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3 mt-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
              <Input
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                required
                className="mt-1 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Role</Label>
                <Select value={editRole} onValueChange={(v: any) => setEditRole(v)}>
                  <SelectTrigger className="mt-1 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">⭐ Incharge</SelectItem>
                    <SelectItem value="karyakarta">👥 Field Worker</SelectItem>
                    <SelectItem value="accountant">💰 Treasurer</SelectItem>
                    <SelectItem value="admin">🛡️ Admin</SelectItem>
                    <SelectItem value="observer">👁️ Observer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Status</Label>
                <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                  <SelectTrigger className="mt-1 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Designation</Label>
              <Input
                value={editDesignation}
                onChange={e => setEditDesignation(e.target.value)}
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStaff(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="btn-saffron rounded-xl font-bold">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
