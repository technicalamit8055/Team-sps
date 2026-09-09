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
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Send,
  Lock,
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
  collector: {
    label: 'चंदा संग्रहकर्ता (Collector)',
    color: 'bg-amber-600',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
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
  collector: {
    label: 'Donation Only (चंदा संग्रह)',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
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
  const [newRole, setNewRole] = useState<MasterRole>('collector');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>(['ent-durga-narayanpur']);
  const [defaultAccessLevel, setDefaultAccessLevel] = useState<WorkspaceAccessLevel>('collector');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit staff form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRole, setEditRole] = useState<MasterRole>('karyakarta');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Credential View / Share Dialog state
  const [credentialModalData, setCredentialModalData] = useState<{
    name: string;
    username: string;
    password: string;
    phone: string;
    roleLabel: string;
    assignedUnitNames: string[];
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = '';
    for (let i = 0; i < 6; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return `Sps@${pass}`;
  };

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success('क्लिपबोर्ड पर कॉपी किया गया!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Please enter name and phone number');
      return;
    }

    const autoUsername = `${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${newRole === 'collector' ? 'collector' : Math.floor(Math.random() * 100)}`;
    const finalUsername = newUsername.trim() || autoUsername;
    const finalPassword = newPassword.trim() || generateRandomPassword();

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
      username: finalUsername,
      password: finalPassword,
      designation: newDesignation.trim() || ROLE_CONFIG[newRole].label,
      primaryRole: newRole,
      status: 'active',
      avatarColor,
      workspacePermissions,
    });

    const assignedUnitNames = selectedWorkspaceIds
      .map(id => entities.find(e => e.id === id)?.name)
      .filter(Boolean) as string[];

    setCredentialModalData({
      name: newName.trim(),
      username: finalUsername,
      password: finalPassword,
      phone: newPhone.trim(),
      roleLabel: ROLE_CONFIG[newRole]?.label || 'कार्यकर्ता',
      assignedUnitNames: assignedUnitNames.length > 0 ? assignedUnitNames : ['श्री दुर्गा पूजा समिति नारायणपुर'],
    });

    setNewName('');
    setNewPhone('');
    setNewUsername('');
    setNewPassword('');
    setNewDesignation('');
    setSelectedWorkspaceIds(['ent-durga-narayanpur']);
    setIsCreateModalOpen(false);
  };

  const handleOpenEdit = (staff: MasterStaff) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditPhone(staff.phone);
    setEditDesignation(staff.designation);
    setEditRole(staff.primaryRole);
    setEditStatus(staff.status);
    setEditPassword(staff.password || '');
    setShowEditPassword(false);
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
      password: editPassword.trim() || editingStaff.password || 'demo123',
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
            { id: 'collector', label: '🎟️ चंदा संग्रहकर्ता' },
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
                          : staff.primaryRole === 'collector'
                          ? 'bg-gradient-to-br from-amber-500 to-amber-700 ring-2 ring-amber-400/30'
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
                    onClick={() => {
                      const assignedUnitNames = Object.keys(staff.workspacePermissions)
                        .map(id => entities.find(e => e.id === id)?.name)
                        .filter(Boolean) as string[];
                      setCredentialModalData({
                        name: staff.name,
                        username: staff.username,
                        password: staff.password || 'demo123',
                        phone: staff.phone,
                        roleLabel: ROLE_CONFIG[staff.primaryRole]?.label || 'कार्यकर्ता',
                        assignedUnitNames: assignedUnitNames.length > 0 ? assignedUnitNames : ['श्री दुर्गा पूजा समिति नारायणपुर'],
                      });
                    }}
                    className="h-7 w-7 p-0 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                    title="View / Share Credentials"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </Button>

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

            {/* Login Credentials Section */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  लॉगिन क्रेडेंशियल्स (Login Credentials)
                </span>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateRandomPassword())}
                  className="text-[10px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>पासवर्ड ऑटो-जनरेट</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Username</Label>
                  <Input
                    placeholder={newName ? `${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}_collector` : 'username_123'}
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="mt-1 text-xs font-mono rounded-xl bg-white"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter or auto-generate"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="text-xs font-mono rounded-xl pr-8 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-amber-800/80">
                💡 सदस्य जोड़ने के तुरंत बाद क्रेडेंशियल्स सीधे WhatsApp पर भेजने का विकल्प मिलेगा।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Role</Label>
                <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                  <SelectTrigger className="mt-1 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collector">🎟️ चंदा संग्रहकर्ता (Collector)</SelectItem>
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
                  <SelectItem value="collector">🎟️ Donation Only (चंदा संग्रह)</SelectItem>
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
                    <SelectItem value="collector">🎟️ चंदा संग्रहकर्ता (Collector)</SelectItem>
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

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Change Password (पासवर्ड बदलें)
              </Label>
              <div className="relative mt-1">
                <Input
                  type={showEditPassword ? 'text' : 'password'}
                  placeholder="Leave blank to keep unchanged"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="text-xs font-mono rounded-xl pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                यदि पासवर्ड नहीं बदलना चाहते हैं, तो इसे खाली छोड़ दें।
              </p>
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

      {/* CREDENTIALS VIEW & WHATSAPP SHARE MODAL */}
      <Dialog open={!!credentialModalData} onOpenChange={open => !open && setCredentialModalData(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <KeyRound className="w-5 h-5" />
              </div>
              <span>कार्यकर्ता लॉगिन क्रेडेंशियल्स (Login Credentials)</span>
            </DialogTitle>
          </DialogHeader>

          {credentialModalData && (
            <div className="space-y-4 mt-2 text-xs">
              {/* Profile banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{credentialModalData.name}</h4>
                  <p className="text-muted-foreground">{credentialModalData.phone} • {credentialModalData.roleLabel}</p>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-semibold">
                  {credentialModalData.roleLabel}
                </Badge>
              </div>

              {/* Credentials Box */}
              <div className="space-y-2.5 bg-gradient-to-br from-amber-50/50 to-orange-50/40 p-3.5 rounded-2xl border border-amber-200/80">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">Username</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(credentialModalData.username, 'username')}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1"
                    >
                      {copiedField === 'username' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'username' ? 'कॉपी हुआ!' : 'कॉपी'}</span>
                    </button>
                  </div>
                  <div className="mt-1 p-2 rounded-xl bg-white border border-amber-200/60 font-mono font-bold text-slate-900 text-sm">
                    {credentialModalData.username}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">Password</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(credentialModalData.password, 'password')}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1"
                    >
                      {copiedField === 'password' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'password' ? 'कॉपी हुआ!' : 'कॉपी'}</span>
                    </button>
                  </div>
                  <div className="mt-1 p-2 rounded-xl bg-white border border-amber-200/60 font-mono font-bold text-slate-900 text-sm">
                    {credentialModalData.password}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-700 block">आवंटित यूनिट (Assigned Unit)</span>
                  <div className="mt-1 p-2 rounded-xl bg-white border border-amber-200/60 font-semibold text-slate-800 text-xs">
                    {credentialModalData.assignedUnitNames.join(', ')}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">पोर्टल लॉगिन लिंक (Login URL)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${window.location.origin}/login`, 'url')}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1"
                    >
                      {copiedField === 'url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'url' ? 'कॉपी हुआ!' : 'कॉपी'}</span>
                    </button>
                  </div>
                  <div className="mt-1 p-2 rounded-xl bg-white border border-amber-200/60 font-mono text-slate-600 text-xs truncate">
                    {window.location.origin}/login
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    const cleanPhone = credentialModalData.phone.replace(/[^0-9]/g, '');
                    const message = `*Team SPS - कार्यकर्ता लॉगिन विवरण*\n\nनमस्ते *${credentialModalData.name}* जी,\nआपको Team SPS सिस्टम में *${credentialModalData.roleLabel}* के रूप में जोड़ा गया है।\n\n🏛️ *आवंटित यूनिट:* ${credentialModalData.assignedUnitNames.join(', ')}\n🌐 *लॉगिन लिंक:* ${window.location.origin}/login\n👤 *Username:* ${credentialModalData.username}\n🔑 *Password:* ${credentialModalData.password}\n\nकृपया लिंक खोलकर अपना Username और Password दर्ज करें।`;
                    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp पर क्रेडेंशियल्स भेजें</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const text = `Team SPS लॉगिन क्रेडेंशियल्स:\nनाम: ${credentialModalData.name}\nUsername: ${credentialModalData.username}\nPassword: ${credentialModalData.password}\nयूनिट: ${credentialModalData.assignedUnitNames.join(', ')}\nलिंक: ${window.location.origin}/login`;
                      handleCopy(text, 'all');
                    }}
                    className="flex-1 rounded-xl text-xs"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    <span>{copiedField === 'all' ? 'समस्त विवरण कॉपी हुआ!' : 'सभी विवरण कॉपी करें'}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCredentialModalData(null)}
                    className="rounded-xl text-xs text-slate-600"
                  >
                    बंद करें
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
