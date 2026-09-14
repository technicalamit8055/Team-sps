/**
 * Mappers from raw Realtime row payloads (snake_case, straight off the wire)
 * to the app's camelCase domain objects.
 *
 * These exist so INSERT and UPDATE can share one definition. They previously
 * lived inline in the Realtime handler, duplicated per event type, and the two
 * copies had already drifted: the UPDATE branch for donations never carried
 * `village`, so a village corrected on one counter stayed wrong on every other
 * screen until a full refresh.
 *
 * A Realtime payload is not a trusted, complete row: `REPLICA IDENTITY FULL`
 * gives us every column on UPDATE/DELETE, but a peer broadcast (layer 1) may
 * carry a partial row, and a column added by a later migration is simply
 * absent on an older client. Every mapper therefore merges onto an existing
 * record where one is available, rather than assuming the payload is whole.
 */
import {
  MasterEntity,
  SamitiEvent,
  SamitiDonation,
  SamitiExpense,
  CashHandoverRecord,
} from '@/types/samiti';
import { MasterStaff } from '@/types/master';

/** Raw Realtime row: shape is only known at runtime. */
export type RealtimeRow = Record<string, any>;

export function mapDonationRow(row: RealtimeRow, prev?: SamitiDonation): SamitiDonation {
  return {
    ...(prev ?? {}),
    id: row.id,
    eventId: row.event_id,
    serialNumber: row.serial_number,
    category: row.category,
    name: row.name,
    identity: row.identity || '',
    caste: row.caste || '',
    village: row.village || '',
    address1: row.address1 || '',
    address2: row.address2 || '',
    phone: row.phone || '',
    acceptedAmount: Number(row.accepted_amount) || 0,
    receivedAmount: Number(row.received_amount) || 0,
    balanceAmount: Number(row.balance_amount) || 0,
    paymentMode: row.payment_mode,
    collectorName: row.collector_name || undefined,
    isHandoverDone: row.is_handover_done ?? false,
    date: row.date,
    remarks: row.remarks || undefined,
    receiptUrl: row.receipt_url || undefined,
    payments: Array.isArray(row.payments) ? row.payments : (prev?.payments ?? []),
    createdAt: row.created_at || prev?.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    // The row reached us over Realtime, so the server has it and has issued
    // its final serial number. Both flags must be cleared here or the entry
    // keeps showing the "असुरक्षित" badge on the very device that saved it.
    isSyncedToCloud: true,
    isProvisionalSerial: false,
  } as SamitiDonation;
}

export function mapExpenseRow(row: RealtimeRow, prev?: SamitiExpense): SamitiExpense {
  return {
    ...(prev ?? {}),
    id: row.id,
    eventId: row.event_id,
    voucherNo: row.voucher_no,
    category: row.category,
    vendorName: row.vendor_name,
    vendorPhone: row.vendor_phone || undefined,
    totalAmount: Number(row.total_amount) || 0,
    amountPaid: Number(row.amount_paid) || 0,
    balanceDue: Number(row.balance_due) || 0,
    paymentMode: row.payment_mode,
    expenseDate: row.expense_date,
    paidBy: row.paid_by || undefined,
    billReceiptUrl: row.bill_receipt_url || undefined,
    notes: row.notes || undefined,
    payments: Array.isArray(row.payments) ? row.payments : (prev?.payments ?? []),
    createdAt: row.created_at || prev?.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
  } as SamitiExpense;
}

export function mapEntityRow(row: RealtimeRow, prev?: MasterEntity): MasterEntity {
  return {
    ...(prev ?? {}),
    id: row.id,
    name: row.name,
    type: row.type,
    upiId: row.upi_id || undefined,
    tagline: row.tagline || undefined,
    location: row.location || undefined,
    establishedYear: row.established_year || undefined,
  } as MasterEntity;
}

export function mapEventRow(row: RealtimeRow, prev?: SamitiEvent): SamitiEvent {
  return {
    ...(prev ?? {}),
    id: row.id,
    entityId: row.entity_id,
    title: row.title,
    fiscalYear: row.fiscal_year,
    targetBudget: Number(row.target_budget) || 0,
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    isActive: row.is_active ?? true,
  } as SamitiEvent;
}

export function mapStaffRow(row: RealtimeRow, prev?: MasterStaff): MasterStaff {
  return {
    ...(prev ?? {}),
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    username: row.username,
    password: row.password_hash || undefined,
    upiId: row.upi_id || undefined,
    primaryRole: row.primary_role,
    designation: row.designation || '',
    status: row.status,
    joinedDate: row.joined_date,
    avatarColor: row.avatar_color || undefined,
    workspacePermissions: row.workspace_permissions || {},
  } as MasterStaff;
}

export function mapHandoverRow(row: RealtimeRow, prev?: CashHandoverRecord): CashHandoverRecord {
  return {
    ...(prev ?? {}),
    id: row.id,
    eventId: row.event_id,
    volunteerName: row.volunteer_name,
    amount: Number(row.amount) || 0,
    status: row.status,
    handedAt: row.handed_at,
    approvedAt: row.approved_at || undefined,
    approvedBy: row.approved_by || undefined,
    notes: row.notes || undefined,
  } as CashHandoverRecord;
}

/**
 * Applies a Realtime row to a list as an upsert: replace when the id is
 * already present, append when it is not.
 *
 * Append-on-miss is the point. A plain `.map()` silently drops an UPDATE for a
 * row the device has never seen -- routine after a screen lock, or when
 * another counter creates and immediately edits a receipt and the two events
 * arrive out of order -- leaving that receipt invisible until a full refresh.
 */
export function upsertById<T extends { id: string }>(
  list: T[],
  row: RealtimeRow,
  map: (row: RealtimeRow, prev?: T) => T
): T[] {
  const idx = list.findIndex(item => item.id === row.id);
  if (idx === -1) return [...list, map(row)];

  const next = map(row, list[idx]);
  // Returning the original array when nothing changed keeps React from
  // re-rendering the whole donation grid for an echo of a change this device
  // already applied -- common now that a write arrives twice, once over
  // broadcast and once over postgres_changes.
  if (shallowEqual(list[idx] as RealtimeRow, next as RealtimeRow)) return list;

  const copy = list.slice();
  copy[idx] = next;
  return copy;
}

function shallowEqual(a: RealtimeRow, b: RealtimeRow): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every(k => {
    const av = a[k];
    const bv = b[k];
    // Arrays (payments) are compared structurally; they are small and are
    // rebuilt on every map, so reference equality would always miss.
    if (Array.isArray(av) || Array.isArray(bv)) {
      return JSON.stringify(av) === JSON.stringify(bv);
    }
    return av === bv;
  });
}

/**
 * Inverse of `mapDonationRow`: the snake_case shape a peer broadcast carries,
 * so the receiving device can feed it through the same mapper as a genuine
 * Postgres event and needs no separate code path for layer 1.
 */
export function donationToRow(d: SamitiDonation): RealtimeRow {
  return {
    id: d.id,
    event_id: d.eventId,
    serial_number: d.serialNumber,
    category: d.category,
    name: d.name,
    identity: d.identity,
    caste: d.caste,
    village: (d as RealtimeRow).village,
    address1: d.address1,
    address2: d.address2,
    phone: d.phone,
    accepted_amount: d.acceptedAmount,
    received_amount: d.receivedAmount,
    balance_amount: d.balanceAmount,
    payment_mode: d.paymentMode,
    collector_name: d.collectorName ?? null,
    is_handover_done: d.isHandoverDone ?? false,
    date: d.date,
    remarks: d.remarks ?? null,
    receipt_url: d.receiptUrl ?? null,
    payments: d.payments ?? [],
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

/** Inverse of `mapExpenseRow`. See `donationToRow`. */
export function expenseToRow(e: SamitiExpense): RealtimeRow {
  return {
    id: e.id,
    event_id: e.eventId,
    voucher_no: e.voucherNo,
    category: e.category,
    vendor_name: e.vendorName,
    vendor_phone: e.vendorPhone ?? null,
    total_amount: e.totalAmount,
    amount_paid: e.amountPaid,
    balance_due: e.balanceDue,
    payment_mode: e.paymentMode,
    expense_date: e.expenseDate,
    paid_by: e.paidBy ?? null,
    bill_receipt_url: e.billReceiptUrl ?? null,
    notes: e.notes ?? null,
    payments: e.payments ?? [],
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}
