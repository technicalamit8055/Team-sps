import React, { useState } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { MasterEntity, EntityType } from '@/types/samiti';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Edit,
  Star,
  ExternalLink,
  Vote,
  FolderKanban,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  Flame,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkspaceManagerViewProps {
  onOpenWorkspace: (id: string) => void;
  searchQuery?: string;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const WorkspaceManagerView: React.FC<WorkspaceManagerViewProps> = ({
  onOpenWorkspace,
  searchQuery = '',
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const {
    entities,
    mainWorkspaceId,
    setMainWorkspaceId,
    isMainWorkspace,
    mainWorkspace,
    addEntity,
    updateEntity,
    deleteEntity,
    resetMasterDemoData,
    events,
    summary,
  } = useSamiti();

  const [filterType, setFilterType] = useState<string>('all');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Create workspace state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<EntityType>('election');
  const [newUpi, setNewUpi] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newBudget, setNewBudget] = useState('500000');

  // Edit workspace state
  const [editingEntity, setEditingEntity] = useState<MasterEntity | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<EntityType>('festival_samiti');
  const [editLocation, setEditLocation] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editUpi, setEditUpi] = useState('');

  // Delete dialog state
  const [entityToDelete, setEntityToDelete] = useState<MasterEntity | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEventTitle.trim()) {
      toast.error('Please enter a unit name and campaign title');
      return;
    }

    addEntity(
      {
        name: newName.trim(),
        type: newType,
        upiId: newUpi.trim() || 'victory@upi',
        tagline: newTagline.trim() || 'Committed to public service & victory',
        location: newLocation.trim() || 'Central Election Office',
        establishedYear: new Date().getFullYear(),
      },
      {
        title: newEventTitle.trim(),
        fiscalYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
        targetBudget: parseFloat(newBudget) || 0,
        isActive: true,
      }
    );

    setNewName('');
    setNewEventTitle('');
    setNewUpi('');
    setNewTagline('');
    setNewLocation('');
    setIsCreateModalOpen(false);
  };

  const handleOpenEdit = (ent: MasterEntity) => {
    setEditingEntity(ent);
    setEditName(ent.name);
    setEditType(ent.type);
    setEditLocation(ent.location || '');
    setEditTagline(ent.tagline || '');
    setEditUpi(ent.upiId || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity || !editName.trim()) return;

    updateEntity(editingEntity.id, {
      name: editName.trim(),
      type: editType,
      location: editLocation.trim(),
      tagline: editTagline.trim(),
      upiId: editUpi.trim(),
    });

    setEditingEntity(null);
  };

  const confirmDeleteEntity = () => {
    if (!entityToDelete) return;

    if (entityToDelete.id === mainWorkspaceId) {
      toast.error('This is the active Main War Room! Set another unit as main first.');
      setEntityToDelete(null);
      return;
    }

    deleteEntity(entityToDelete.id);
    setEntityToDelete(null);
  };

  // Filtered entities
  const filteredEntities = entities.filter(ent => {
    const matchesFilter = filterType === 'all' || ent.type === filterType;
    const matchesSearch =
      !searchQuery ||
      ent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ent.location && ent.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ent.tagline && ent.tagline.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner: KPI Cards with Tricolor Top Bar Accent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Units */}
        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Units
            </span>
            <Vote className="w-4 h-4 text-saffron" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
            {entities.length}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-700 font-semibold">
              100% Operational
            </span>
          </div>
        </div>

        {/* KPI 2: Active Main War Room */}
        <div className="kpi-card shadow-sm bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Main War Room
            </span>
            <Star className="w-4 h-4 fill-saffron text-saffron" />
          </div>
          <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 truncate">
            {mainWorkspace?.name || 'Election Campaign 2026'}
          </p>
          <span className="text-[10px] text-saffron-dark font-semibold block mt-1">
            Default Command Center
          </span>
        </div>

        {/* KPI 3: Campaigns / Sessions */}
        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Campaigns
            </span>
            <Calendar className="w-4 h-4 text-navy" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
            {events.length}
          </p>
          <span className="text-[11px] text-muted-foreground block mt-1">
            2026-27 Election Cycle
          </span>
        </div>

        {/* KPI 4: Net Surplus */}
        <div className="kpi-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Net Surplus
            </span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 font-mono">
            ₹{summary.netSurplus.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-muted-foreground block mt-1">
            Combined Campaign Reserve
          </span>
        </div>
      </div>

      {/* Filter Tabs & Add Button Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Units' },
            { id: 'election', label: '🗳️ War Rooms' },
            { id: 'festival_samiti', label: '🪔 Cultural' },
            { id: 'business', label: '🏢 Business' },
            { id: 'rwa', label: '🏛️ Society / RWA' },
          ].map(tab => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
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

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsResetDialogOpen(true)}
            className="text-xs h-8 px-2.5 sm:px-3 rounded-xl border-amber-300 text-amber-900 bg-amber-50/80 hover:bg-amber-100 hover:text-amber-950 font-semibold shadow-none flex items-center gap-1.5"
            title="Reset master demo data and purge from cloud database"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>रीसेट डेमो डेटा</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-saffron text-xs h-8 px-3 rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Unit</span>
          </Button>
        </div>
      </div>

      {/* Workspace Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredEntities.map(ent => {
          const isMain = isMainWorkspace(ent.id);
          const isElection = ent.type === 'election';

          return (
            <div
              key={ent.id}
              className={`glass-panel p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between relative group hover:shadow-lg ${
                isMain
                  ? 'border-saffron ring-2 ring-saffron/30 shadow-md'
                  : 'hover:border-saffron/40'
              }`}
            >
              {/* Top Tricolor Accent Line for Main Workspace */}
              {isMain && (
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-saffron via-white to-emerald-500" />
              )}

              <div className="space-y-3">
                {/* Top Strip */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isElection
                          ? 'bg-saffron/10 text-saffron border border-saffron/30'
                          : ent.type === 'festival_samiti'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {isElection ? (
                        <Vote className="w-5 h-5 text-saffron" />
                      ) : ent.type === 'festival_samiti' ? (
                        <Flame className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Building2 className="w-5 h-5 text-navy" />
                      )}
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          isElection
                            ? 'bg-saffron/10 text-saffron-dark border-saffron/30'
                            : ent.type === 'festival_samiti'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {isElection
                          ? 'War Room'
                          : ent.type === 'festival_samiti'
                          ? 'Samiti'
                          : 'Commercial'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono">
                        Est. {ent.establishedYear || 2026}
                      </span>
                    </div>
                  </div>

                  {/* Main Workspace Badge */}
                  {isMain ? (
                    <Badge className="bg-saffron text-white font-bold text-[10px] flex items-center gap-1 py-0.5 px-2 rounded-full border-none shadow-xs">
                      <Star className="w-3 h-3 fill-white" />
                      Main Unit
                    </Badge>
                  ) : (
                    <button
                      onClick={() => setMainWorkspaceId(ent.id)}
                      className="text-[11px] font-medium text-slate-500 hover:text-saffron hover:bg-saffron/10 px-2 py-0.5 rounded-lg border border-slate-200 hover:border-saffron/30 transition-all flex items-center gap-1"
                      title="Set as Main War Room"
                    >
                      <Star className="w-3 h-3" />
                      <span>Set Main</span>
                    </button>
                  )}
                </div>

                {/* Name & Tagline */}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-navy leading-snug">
                    {ent.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {ent.tagline || ent.location || 'Active Management Unit'}
                  </p>
                </div>

                {/* Location & UPI Info */}
                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-saffron" />
                      Location:
                    </span>
                    <span className="font-medium text-slate-800 truncate max-w-[170px]">
                      {ent.location || 'Central Office'}
                    </span>
                  </div>
                  {ent.upiId && (
                    <div className="flex items-center justify-between text-slate-700 font-mono">
                      <span className="text-[11px] text-muted-foreground">UPI:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[170px]">
                        {ent.upiId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(ent)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-navy hover:bg-slate-100 rounded-lg"
                    title="Edit Details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEntityToDelete(ent)}
                    className={`h-7 w-7 p-0 rounded-lg ${
                      isMain
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-muted-foreground hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title={
                      isMain
                        ? 'Main workspace cannot be deleted'
                        : 'Delete Unit'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => onOpenWorkspace(ent.id)}
                  className={`text-xs font-bold h-7 px-2.5 rounded-lg transition-all ${
                    isElection
                      ? 'btn-saffron shadow-2xs'
                      : isMain
                      ? 'bg-navy hover:bg-navy-dark text-white'
                      : 'bg-slate-100 hover:bg-navy hover:text-white text-slate-800'
                  }`}
                >
                  <span>{isElection ? 'Open War Room' : 'Open Unit'}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}

        {/* Add Workspace Card */}
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="border-2 border-dashed border-saffron/40 hover:border-saffron rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer bg-saffron/5 hover:bg-saffron/10 transition-all min-h-[220px] group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-saffron group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 group-hover:text-navy">
              + Add New Unit
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[210px]">
              Set up a campaign war room, festival samiti, or commercial project
            </p>
          </div>
        </div>
      </div>

      {/* CREATE WORKSPACE DIALOG */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-saffron/10 text-saffron">
                <Vote className="w-5 h-5" />
              </div>
              <span>Create New Workspace</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3 mt-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Unit Name *</Label>
              <Input
                placeholder="e.g. Assembly 2026 War Room / Festival Samiti"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Type</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger className="mt-1 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="election">🗳️ Election War Room</SelectItem>
                    <SelectItem value="festival_samiti">🪔 Cultural / Festival</SelectItem>
                    <SelectItem value="business">🏢 Business / Trade</SelectItem>
                    <SelectItem value="rwa">🏛️ Society / RWA</SelectItem>
                    <SelectItem value="ngo">🤝 Trust / NGO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Location</Label>
                <Input
                  placeholder="e.g. Central Office"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="mt-1 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Tagline</Label>
              <Input
                placeholder="e.g. Dedicated to victory & public service"
                value={newTagline}
                onChange={e => setNewTagline(e.target.value)}
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Initial Campaign Title *</Label>
              <Input
                placeholder="e.g. Assembly Election 2026"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                required
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Target Budget (₹)</Label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={newBudget}
                  onChange={e => setNewBudget(e.target.value)}
                  className="mt-1 text-xs font-mono rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">UPI ID</Label>
                <Input
                  placeholder="victory@upi"
                  value={newUpi}
                  onChange={e => setNewUpi(e.target.value)}
                  className="mt-1 text-xs font-mono rounded-xl"
                />
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
                Create Workspace
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT WORKSPACE DIALOG */}
      <Dialog open={!!editingEntity} onOpenChange={open => !open && setEditingEntity(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-navy/10 text-navy">
                <Edit className="w-4 h-4" />
              </div>
              <span>Edit Workspace Details</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3 mt-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Unit Name *</Label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Type</Label>
                <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                  <SelectTrigger className="mt-1 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="election">🗳️ Election War Room</SelectItem>
                    <SelectItem value="festival_samiti">🪔 Cultural / Festival</SelectItem>
                    <SelectItem value="business">🏢 Business / Trade</SelectItem>
                    <SelectItem value="rwa">🏛️ Society / RWA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Location</Label>
                <Input
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className="mt-1 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Tagline</Label>
              <Input
                value={editTagline}
                onChange={e => setEditTagline(e.target.value)}
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">UPI ID</Label>
              <Input
                value={editUpi}
                onChange={e => setEditUpi(e.target.value)}
                className="mt-1 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingEntity(null)}
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

      {/* SAFE DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={!!entityToDelete} onOpenChange={open => !open && setEntityToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Confirm Delete Workspace</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 space-y-2 mt-2">
              {entityToDelete?.id === mainWorkspaceId ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 font-medium">
                  ⚠️ <strong>This is the active Main War Room!</strong>
                  <br />
                  For safety, it cannot be deleted directly. Set another unit as Main first.
                </div>
              ) : (
                <>
                  <p>
                    Are you sure you want to permanently delete <strong>"{entityToDelete?.name}"</strong>?
                  </p>
                  <p className="text-rose-600 font-medium">
                    All associated sessions, vouchers, and permissions will be permanently removed.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="text-xs rounded-xl">Cancel</AlertDialogCancel>
            {entityToDelete?.id !== mainWorkspaceId && (
              <AlertDialogAction
                onClick={confirmDeleteEntity}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              >
                Delete Unit
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Master Demo Data Confirmation Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-900 text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              मास्टर डेमो डेटा रीसेट व क्लाउड पर्ज
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-xs sm:text-sm space-y-3 pt-2">
              <p>
                क्या आप मास्टर OS और क्लाउड डेटाबेस से सभी पुराने डेमो डेटा हटाना चाहते हैं?
              </p>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-medium space-y-1">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  🛡️ सुरक्षित रखे जाएंगे:
                </span>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>श्री दुर्गा पूजा समिति, नारायणपुर (समस्त चंदा व खर्चा रिकॉर्ड)</li>
                  <li>चुनाव अभियान प्रबंधन (Victory OS Election Command)</li>
                </ul>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-900 text-xs font-medium space-y-1">
                <span className="font-bold text-rose-800 flex items-center gap-1">
                  🗑️ क्लाउड डेटाबेस से हटाए जाएंगे:
                </span>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>श्री गणेश उत्सव मंडल एवं व्यापार मंडल के समस्त डेमो डेटा</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="text-xs rounded-xl">रद्द करें</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await resetMasterDemoData();
                setIsResetDialogOpen(false);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
            >
              हाँ, डेमो डेटा हटाएं व रीसेट करें
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
