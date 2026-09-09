export type MasterRole = 'admin' | 'manager' | 'accountant' | 'karyakarta' | 'collector' | 'observer';

export type WorkspaceAccessLevel = 'full_control' | 'editor' | 'viewer' | 'collector' | 'no_access';

export interface ModuleAccess {
  votersCRM: boolean;       // Election CRM, voter lists, surveys
  donationsLedger: boolean; // Chanda sheet, Excel data grid
  expenses: boolean;        // Kharcha manager, voucher entry
  analytics: boolean;       // Financial & demographic charts
  karyakartaMgmt: boolean;  // Manage volunteers in that workspace
  exportData: boolean;      // Excel/PDF download & export
}

export const DEFAULT_MODULE_ACCESS_MAP: Record<WorkspaceAccessLevel, ModuleAccess> = {
  full_control: {
    votersCRM: true,
    donationsLedger: true,
    expenses: true,
    analytics: true,
    karyakartaMgmt: true,
    exportData: true,
  },
  editor: {
    votersCRM: true,
    donationsLedger: true,
    expenses: true,
    analytics: true,
    karyakartaMgmt: false,
    exportData: true,
  },
  viewer: {
    votersCRM: true,
    donationsLedger: true,
    expenses: true,
    analytics: true,
    karyakartaMgmt: false,
    exportData: false,
  },
  collector: {
    votersCRM: false,
    donationsLedger: true,  // Can add donations and view entries made
    expenses: false,         // Strictly hidden
    analytics: false,        // Strictly hidden
    karyakartaMgmt: false,   // Strictly hidden
    exportData: false,       // Strictly hidden
  },
  no_access: {
    votersCRM: false,
    donationsLedger: false,
    expenses: false,
    analytics: false,
    karyakartaMgmt: false,
    exportData: false,
  },
};

export interface WorkspacePermission {
  workspaceId: string;
  accessLevel: WorkspaceAccessLevel;
  modules: ModuleAccess;
}

export interface MasterStaff {
  id: string;
  name: string;
  phone: string;
  email?: string;
  username: string;
  password?: string;
  primaryRole: MasterRole;
  designation: string; // e.g. "मुख्य प्रशासक", "वॉर रूम हेड", "कोषाध्यक्ष"
  status: 'active' | 'inactive';
  joinedDate: string;
  avatarColor?: string;
  workspacePermissions: Record<string, WorkspacePermission>; // workspaceId -> WorkspacePermission
}

export type MasterNavSection =
  | 'workspaces'
  | 'manage-workspaces'
  | 'staff-team'
  | 'access-control'
  | 'master-analytics';
