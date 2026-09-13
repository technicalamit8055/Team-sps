export type MasterRole = 'admin' | 'manager' | 'accountant' | 'karyakarta' | 'collector' | 'tablet' | 'observer';

/**
 * `tablet` is a shared-device account, not a person. The tablet sits at the
 * pandal and whichever member picks it up enters chanda on it, so unlike a
 * `collector` account — which is locked to the one person it belongs to — a
 * tablet account must let the operator pick the संग्रहकर्ता by name from the
 * registered list on every receipt.
 */
export type WorkspaceAccessLevel = 'full_control' | 'editor' | 'viewer' | 'collector' | 'tablet' | 'no_access';

export interface ModuleAccess {
  votersCRM: boolean;       // Election CRM, voter lists, surveys
  donationsLedger: boolean; // Chanda sheet, Excel data grid
  expenses: boolean;        // Kharcha manager, voucher entry
  pandalPujaKharcha: boolean; // पंडाल एवं पूजा व्यय section of the Durga Puja unit
  analytics: boolean;       // Financial & demographic charts
  karyakartaMgmt: boolean;  // Manage volunteers in that workspace
  exportData: boolean;      // Excel/PDF download & export
  /**
   * Revise an amount that is already on the books — a donor's pledge, the
   * money already receipted against it, or a vendor's bill and payments.
   *
   * Withheld from everyone but full-access members on purpose. A collector
   * who mistypes a receipt must have it corrected by an admin, and money a
   * donor has already handed over can never be quietly reduced. Without this
   * flag a member can still collect more against a pledge (बकाया जमा) —
   * that only ever moves the received figure upward.
   */
  editFinalizedAmounts: boolean;
}

export const DEFAULT_MODULE_ACCESS_MAP: Record<WorkspaceAccessLevel, ModuleAccess> = {
  full_control: {
    votersCRM: true,
    donationsLedger: true,
    expenses: true,
    pandalPujaKharcha: true,
    analytics: true,
    karyakartaMgmt: true,
    exportData: true,
    editFinalizedAmounts: true,
  },
  editor: {
    votersCRM: true,
    donationsLedger: true,
    expenses: true,
    pandalPujaKharcha: true,
    analytics: true,
    karyakartaMgmt: false,
    exportData: true,
    editFinalizedAmounts: false, // may add entries, but not revise saved amounts
  },
  viewer: {
    votersCRM: true,
    donationsLedger: true,
    expenses: true,
    pandalPujaKharcha: true,
    analytics: true,
    karyakartaMgmt: false,
    exportData: false,
    editFinalizedAmounts: false,
  },
  collector: {
    votersCRM: false,
    donationsLedger: true,  // Can add donations and view entries made
    expenses: false,         // Strictly hidden
    pandalPujaKharcha: false, // Hidden unless explicitly granted in the matrix
    analytics: false,        // Strictly hidden
    karyakartaMgmt: false,   // Strictly hidden
    exportData: false,       // Strictly hidden
    editFinalizedAmounts: false, // Corrections must be made by an admin
  },
  // Same restrictions as a collector — the difference is only that the
  // संग्रहकर्ता name is chosen per receipt rather than locked to the account.
  tablet: {
    votersCRM: false,
    donationsLedger: true,   // The whole point of the device
    expenses: false,         // Strictly hidden
    pandalPujaKharcha: false,
    analytics: false,        // Strictly hidden — a shared device shows no totals
    karyakartaMgmt: false,
    exportData: false,       // Strictly hidden
    editFinalizedAmounts: false, // Corrections must be made by an admin
  },
  no_access: {
    votersCRM: false,
    donationsLedger: false,
    expenses: false,
    pandalPujaKharcha: false,
    analytics: false,
    karyakartaMgmt: false,
    exportData: false,
    editFinalizedAmounts: false,
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
  // Real Supabase Auth user id this staff record is linked to. Login
  // credentials live only in Supabase Auth (via the create-user edge
  // function) — never stored in plaintext on this record.
  userId?: string;
  /**
   * This member's own UPI id, for chanda collected straight into their
   * account. Optional — when unset, QR codes and payment prompts fall back to
   * the workspace's UPI id (MasterEntity.upiId), which is how every member
   * behaved before this field existed.
   */
  upiId?: string;
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
  | 'master-analytics'
  | 'integrations';
