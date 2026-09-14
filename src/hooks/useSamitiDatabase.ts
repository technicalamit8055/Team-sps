import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  MasterEntity,
  SamitiEvent,
  SamitiDonation,
  SamitiExpense,
  CashHandoverRecord,
} from '@/types/samiti';
import { MasterStaff } from '@/types/master';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database, Json } from '@/integrations/supabase/types';

/**
 * Outcome of asking the server for a receipt number.
 *
 * Three-way on purpose. Collapsing 'error' into 'offline' is what let a broken
 * save masquerade as a successful one: the caller parked the entry locally,
 * showed a success toast, and the collector only discovered the loss after
 * closing the app. 'offline' is expected at a pandal and retried silently;
 * 'error' means the write was refused and must be surfaced.
 */
export type ClaimResult =
  | { status: 'ok'; donation: SamitiDonation }
  | { status: 'offline' }
  | { status: 'error'; message: string; code?: string };

/**
 * Best-effort read of a PostgREST/Supabase error code. Used only to turn the
 * two failures an operator can act on into plain Hindi; everything else falls
 * through to the raw message.
 */
function errorCodeOf(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

export function useSamitiDatabase() {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(
    () => (typeof navigator !== 'undefined' ? navigator.onLine : true)
  );
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsCloudConnected(true);
    const handleOffline = () => setIsCloudConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // -------------------------------------------------------------
  // ENTITIES
  // -------------------------------------------------------------
  const fetchEntitiesFromCloud = useCallback(async (): Promise<MasterEntity[] | null> => {
    try {
      const { data, error } = await supabase
        .from('samiti_entities')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not fetch entities from Supabase:', error.message);
        return null;
      }

      if (!data || data.length === 0) return [];

      return data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as any,
        upiId: item.upi_id || undefined,
        tagline: item.tagline || undefined,
        location: item.location || undefined,
        establishedYear: item.established_year || undefined,
      }));
    } catch (err) {
      console.warn('Network error fetching entities:', err);
      return null;
    }
  }, []);

  const saveEntityToCloud = useCallback(async (entity: MasterEntity) => {
    try {
      const { error } = await supabase.from('samiti_entities').upsert({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        upi_id: entity.upiId || null,
        tagline: entity.tagline || null,
        location: entity.location || null,
        established_year: entity.establishedYear || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to upsert entity to Supabase:', err.message);
    }
  }, []);

  const deleteEntityFromCloud = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('samiti_entities').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to delete entity from Supabase:', err.message);
    }
  }, []);

  // -------------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------------
  const fetchEventsFromCloud = useCallback(async (): Promise<SamitiEvent[] | null> => {
    try {
      const { data, error } = await supabase
        .from('samiti_events')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not fetch events from Supabase:', error.message);
        return null;
      }

      if (!data || data.length === 0) return [];

      return data.map(item => ({
        id: item.id,
        entityId: item.entity_id,
        title: item.title,
        fiscalYear: item.fiscal_year,
        targetBudget: item.target_budget || 0,
        startDate: item.start_date || undefined,
        endDate: item.end_date || undefined,
        isActive: item.is_active ?? true,
      }));
    } catch (err) {
      console.warn('Network error fetching events:', err);
      return null;
    }
  }, []);

  const saveEventToCloud = useCallback(async (event: SamitiEvent) => {
    try {
      const { error } = await supabase.from('samiti_events').upsert({
        id: event.id,
        entity_id: event.entityId,
        title: event.title,
        fiscal_year: event.fiscalYear,
        target_budget: event.targetBudget,
        start_date: event.startDate || null,
        end_date: event.endDate || null,
        is_active: event.isActive,
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to upsert event to Supabase:', err.message);
    }
  }, []);

  // -------------------------------------------------------------
  // DONATIONS (CHANDA)
  // -------------------------------------------------------------
  const fetchDonationsFromCloud = useCallback(async (): Promise<SamitiDonation[] | null> => {
    try {
      const { data, error } = await supabase
        .from('samiti_donations')
        .select('*')
        .order('serial_number', { ascending: true });

      if (error) {
        console.warn('Could not fetch donations from Supabase:', error.message);
        toast.error(`दान सूची लोड नहीं हो सकी: ${error.message}`);
        return null;
      }

      if (!data) return [];

      return data.map(item => ({
        id: item.id,
        eventId: item.event_id,
        serialNumber: item.serial_number,
        category: item.category as any,
        name: item.name,
        identity: item.identity || '',
        caste: item.caste || '',
        village: (item as any).village || '',
        address1: item.address1 || '',
        address2: item.address2 || '',
        phone: item.phone || '',
        acceptedAmount: item.accepted_amount,
        receivedAmount: item.received_amount,
        balanceAmount: item.balance_amount,
        paymentMode: item.payment_mode as any,
        collectorName: item.collector_name || undefined,
        isHandoverDone: item.is_handover_done ?? false,
        date: item.date,
        remarks: item.remarks || undefined,
        receiptUrl: item.receipt_url || undefined,
        payments: Array.isArray((item as any).payments) ? ((item as any).payments as SamitiDonation["payments"]) : [],
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
        // It came from the server, so it is on the server. This is what lets a
        // later sync tell "deleted elsewhere" (drop it) apart from "not yet
        // uploaded" (keep it).
        isSyncedToCloud: true,
        isProvisionalSerial: false,
      }));
    } catch (err) {
      console.warn('Network error fetching donations:', err);
      return null;
    }
  }, []);

  /**
   * Insert a brand-new donation and let the SERVER decide its receipt number.
   *
   * Several counters collect at the same time on separate tablets. Computing
   * `max(serialNumber) + 1` on the device produced duplicate receipt numbers
   * whenever two counters saved inside the same Realtime propagation window —
   * both read the same maximum. `claim_donation_serial` allocates the number
   * and writes the row inside one transaction, under a per-event advisory
   * lock, so concurrent saves queue rather than collide.
   *
   * Returns the stored row with its authoritative `serialNumber` on success.
   * A genuine loss of connectivity returns 'offline' and is retried on the next
   * sync; anything the server actively refused returns 'error' so the caller
   * can tell the operator instead of pretending the entry was saved.
   */
  const claimDonationInCloud = useCallback(
    async (donation: SamitiDonation): Promise<ClaimResult> => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { status: 'offline' };
      }

      try {
        const { data, error } = await supabase.rpc('claim_donation_serial', {
          p_event_id: donation.eventId,
          p_donation: {
            id: donation.id,
            category: donation.category,
            name: donation.name,
            identity: donation.identity || null,
            caste: donation.caste || null,
            village: donation.village || null,
            address1: donation.address1 || null,
            address2: donation.address2 || null,
            phone: donation.phone || null,
            accepted_amount: donation.acceptedAmount,
            received_amount: donation.receivedAmount,
            balance_amount: donation.balanceAmount,
            payment_mode: donation.paymentMode,
            collector_name: donation.collectorName || null,
            is_handover_done: donation.isHandoverDone ?? false,
            date: donation.date,
            remarks: donation.remarks || null,
            receipt_url: donation.receiptUrl || null,
            payments: donation.payments ?? [],
          } as unknown as Json,
        });

        if (error) throw error;

        // PostgREST returns a table-returning function as a single row object,
        // but tolerate a one-element array so a client/PostgREST upgrade that
        // changes the shape does not silently drop the confirmed number.
        type ClaimedRow = Database['public']['Tables']['samiti_donations']['Row'];
        const row = (Array.isArray(data) ? data[0] : data) as ClaimedRow | undefined;

        // The call succeeded but produced no row. That should not happen, and
        // treating it as "offline" would park the entry as if the network were
        // at fault, so it is reported as the anomaly it is.
        if (!row) {
          return {
            status: 'error',
            message: 'सर्वर ने रसीद क्रमांक नहीं लौटाया।',
          };
        }

        return {
          status: 'ok',
          donation: {
            ...donation,
            id: row.id,
            serialNumber: row.serial_number,
            balanceAmount: Number(row.balance_amount) || 0,
            createdAt: row.created_at || donation.createdAt,
            updatedAt: row.updated_at || donation.updatedAt,
            // The number is now server-issued, so it is no longer provisional —
            // this matters when re-claiming an entry recorded offline.
            isProvisionalSerial: false,
            // The allocator wrote the row in the same transaction that issued
            // the number, so it is definitively on the server.
            isSyncedToCloud: true,
          },
        };
      } catch (err) {
        const code = errorCodeOf(err);
        const raw = err instanceof Error ? err.message : String(err);

        // A dropped connection mid-request throws rather than being caught by
        // the navigator.onLine check above. Only this case is retryable.
        const isNetworkFailure =
          err instanceof TypeError ||
          /failed to fetch|network ?error|load failed/i.test(raw);

        if (isNetworkFailure) {
          console.warn('Receipt number claim failed (network):', raw);
          return { status: 'offline' };
        }

        // Everything below is the server actively refusing the write. These
        // used to be reported as "offline", which is how a missing allocator
        // (PGRST202) silently swallowed five receipts.
        let message = raw;
        if (code === 'PGRST202') {
          message =
            'डेटाबेस अपडेट बाकी है — रसीद क्रमांक देने वाला फ़ंक्शन मौजूद नहीं है। व्यवस्थापक से संपर्क करें।';
        } else if (code === '42501' || /row-level security/i.test(raw)) {
          message = 'इस इवेंट में प्रविष्टि दर्ज करने की अनुमति नहीं है।';
        }

        console.error('Receipt number claim rejected by server:', code, raw);
        return { status: 'error', message, code };
      }
    },
    []
  );

  const saveDonationToCloud = useCallback(async (donation: SamitiDonation) => {
    try {
      const { error } = await supabase.from('samiti_donations').upsert({
        id: donation.id,
        event_id: donation.eventId,
        serial_number: donation.serialNumber,
        category: donation.category,
        name: donation.name,
        identity: donation.identity || null,
        caste: donation.caste || null,
        village: donation.village || null,
        address1: donation.address1 || null,
        address2: donation.address2 || null,
        phone: donation.phone || null,
        accepted_amount: donation.acceptedAmount,
        received_amount: donation.receivedAmount,
        balance_amount: donation.balanceAmount,
        payment_mode: donation.paymentMode,
        collector_name: donation.collectorName || null,
        is_handover_done: donation.isHandoverDone ?? false,
        date: donation.date,
        remarks: donation.remarks || null,
        receipt_url: donation.receiptUrl || null,
        payments: donation.payments ?? [],
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to upsert donation to Supabase:', err.message);
      toast.error(`दान प्रविष्टि सेव नहीं हो सकी: ${err.message}`);
    }
  }, []);

  const deleteDonationFromCloud = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('samiti_donations').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to delete donation from Supabase:', err.message);
    }
  }, []);

  const bulkSaveDonationsToCloud = useCallback(async (donationsList: SamitiDonation[]) => {
    try {
      const payload = donationsList.map(d => ({
        id: d.id,
        event_id: d.eventId,
        serial_number: d.serialNumber,
        category: d.category,
        name: d.name,
        identity: d.identity || null,
        caste: d.caste || null,
        village: d.village || null,
        address1: d.address1 || null,
        address2: d.address2 || null,
        phone: d.phone || null,
        accepted_amount: d.acceptedAmount,
        received_amount: d.receivedAmount,
        balance_amount: d.balanceAmount,
        payment_mode: d.paymentMode,
        collector_name: d.collectorName || null,
        is_handover_done: d.isHandoverDone ?? false,
        date: d.date,
        remarks: d.remarks || null,
        receipt_url: d.receiptUrl || null,
        payments: d.payments ?? [],
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('samiti_donations').upsert(payload);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Bulk save donations to Supabase failed:', err.message);
    }
  }, []);

  // -------------------------------------------------------------
  // EXPENSES (KHARCHA)
  // -------------------------------------------------------------
  const fetchExpensesFromCloud = useCallback(async (): Promise<SamitiExpense[] | null> => {
    try {
      const { data, error } = await supabase
        .from('samiti_expenses')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not fetch expenses from Supabase:', error.message);
        return null;
      }

      if (!data) return [];

      return data.map(item => ({
        id: item.id,
        eventId: item.event_id,
        voucherNo: item.voucher_no,
        category: item.category as any,
        vendorName: item.vendor_name,
        vendorPhone: item.vendor_phone || undefined,
        totalAmount: item.total_amount,
        amountPaid: item.amount_paid,
        balanceDue: item.balance_due,
        paymentMode: item.payment_mode as any,
        expenseDate: item.expense_date,
        paidBy: item.paid_by || undefined,
        billReceiptUrl: item.bill_receipt_url || undefined,
        notes: item.notes || undefined,
        payments: Array.isArray((item as any).payments) ? ((item as any).payments as SamitiExpense['payments']) : [],
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: (item as any).updated_at || item.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Network error fetching expenses:', err);
      return null;
    }
  }, []);

  const saveExpenseToCloud = useCallback(async (expense: SamitiExpense) => {
    try {
      const { error } = await supabase.from('samiti_expenses').upsert({
        id: expense.id,
        event_id: expense.eventId,
        voucher_no: expense.voucherNo,
        category: expense.category,
        vendor_name: expense.vendorName,
        vendor_phone: expense.vendorPhone || null,
        total_amount: expense.totalAmount,
        amount_paid: expense.amountPaid,
        balance_due: expense.balanceDue,
        payment_mode: expense.paymentMode,
        expense_date: expense.expenseDate,
        paid_by: expense.paidBy || null,
        bill_receipt_url: expense.billReceiptUrl || null,
        notes: expense.notes || null,
        payments: expense.payments ?? [],
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to upsert expense to Supabase:', err.message);
    }
  }, []);

  const deleteExpenseFromCloud = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('samiti_expenses').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to delete expense from Supabase:', err.message);
    }
  }, []);

  // -------------------------------------------------------------
  // STAFF
  // -------------------------------------------------------------
  const fetchStaffFromCloud = useCallback(async (): Promise<MasterStaff[] | null> => {
    try {
      const { data, error } = await supabase
        .from('master_staff')
        .select('*')
        .order('joined_date', { ascending: true });

      if (error) {
        console.warn('Could not fetch staff from Supabase:', error.message);
        return null;
      }

      if (!data || data.length === 0) return [];

      return data.map(item => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        email: item.email || undefined,
        username: item.username,
        userId: (item as any).user_id || undefined,
        upiId: (item as any).upi_id || undefined,
        primaryRole: item.primary_role as any,
        designation: item.designation || '',
        status: item.status as any,
        joinedDate: item.joined_date,
        avatarColor: item.avatar_color || undefined,
        workspacePermissions: (item.workspace_permissions as any) || {},
      }));
    } catch (err) {
      console.warn('Network error fetching staff:', err);
      return null;
    }
  }, []);

  /**
   * Upserts a staff roster row.
   *
   * `throwOnError` matters for account creation. Every worker-facing RLS policy
   * resolves the member's access through `get_staff_workspace_ids(auth.uid())`,
   * which looks the caller up in `master_staff` by `user_id`. A member whose
   * roster row was not written therefore has no readable workspace at all: the
   * chanda register, entities and events all come back empty, and the roster
   * itself loses them on the next sync. Swallowing the error there produces a
   * login that exists but can see nothing, with no sign anything went wrong —
   * so callers that are creating an account must opt into the throw.
   */
  const saveStaffToCloud = useCallback(async (staff: MasterStaff, throwOnError = false) => {
    try {
      // Note: real login credentials live in Supabase Auth (created via the
      // create-user edge function), not in this table — no plaintext password
      // is ever written here for staff created through the current flow.
      const { error } = await supabase.from('master_staff').upsert({
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        email: staff.email || null,
        username: staff.username,
        user_id: staff.userId || null,
        upi_id: staff.upiId || null,
        primary_role: staff.primaryRole,
        designation: staff.designation || null,
        status: staff.status,
        joined_date: staff.joinedDate,
        avatar_color: staff.avatarColor || null,
        workspace_permissions: staff.workspacePermissions as any,
      } as any);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to upsert staff to Supabase:', err.message);
      if (throwOnError) throw err;
    }
  }, []);

  /**
   * @deprecated Removes only the roster row. The Supabase Auth user, profile and
   * role survive, so the account can still sign in — and an account with no
   * roster row resolves as an unscoped admin in `fetchStaffCollectorInfo`. To
   * remove a member, call the `delete-user` edge function (see
   * `SamitiContext.deleteStaff`), which revokes the login as well.
   */
  const deleteStaffFromCloud = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('master_staff').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to delete staff from Supabase:', err.message);
    }
  }, []);

  // -------------------------------------------------------------
  // CASH HANDOVERS
  // -------------------------------------------------------------
  const fetchHandoversFromCloud = useCallback(async (): Promise<CashHandoverRecord[] | null> => {
    try {
      const { data, error } = await supabase
        .from('samiti_cash_handovers')
        .select('*')
        .order('handed_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(item => ({
        id: item.id,
        eventId: item.event_id,
        volunteerName: item.volunteer_name,
        amount: Number(item.amount) || 0,
        status: item.status as any,
        handedAt: item.handed_at,
        approvedAt: item.approved_at || undefined,
        approvedBy: item.approved_by || undefined,
        notes: item.notes || undefined,
      }));
    } catch (err: any) {
      console.warn('Could not fetch handovers from Supabase:', err.message);
      return null;
    }
  }, []);

  const saveHandoverToCloud = useCallback(async (record: CashHandoverRecord) => {
    try {
      const { error } = await supabase.from('samiti_cash_handovers').upsert({
        id: record.id,
        event_id: record.eventId,
        volunteer_name: record.volunteerName,
        amount: record.amount,
        status: record.status,
        handed_at: record.handedAt,
        approved_at: record.approvedAt || null,
        approved_by: record.approvedBy || null,
        notes: record.notes || null,
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to upsert handover to Supabase:', err.message);
    }
  }, []);

  // -------------------------------------------------------------
  // PURGE DEMO ENTITIES (Except Durga Puja Unit & Election Command)
  // -------------------------------------------------------------
  const purgeDemoEntitiesFromCloud = useCallback(async (keepEntityIds: string[] = ['ent-durga-narayanpur', 'ent-election-2026']) => {
    try {
      setIsSyncing(true);
      const { data: allEntities } = await supabase.from('samiti_entities').select('id');
      if (allEntities && allEntities.length > 0) {
        const toDeleteIds = allEntities
          .map(e => e.id)
          .filter(id => !keepEntityIds.includes(id));

        if (toDeleteIds.length > 0) {
          await supabase.from('samiti_events').delete().in('entity_id', toDeleteIds);
          await supabase.from('samiti_entities').delete().in('id', toDeleteIds);
        }
      }

      // Clean staff permissions
      const { data: staffList } = await supabase.from('master_staff').select('*');
      if (staffList && staffList.length > 0) {
        for (const staff of staffList) {
          const perms = (staff.workspace_permissions as any) || {};
          let changed = false;
          const cleanPerms: Record<string, any> = {};
          for (const [wsId, val] of Object.entries(perms)) {
            if (keepEntityIds.includes(wsId)) {
              cleanPerms[wsId] = val;
            } else {
              changed = true;
            }
          }
          if (changed) {
            await supabase
              .from('master_staff')
              .update({ workspace_permissions: cleanPerms })
              .eq('id', staff.id);
          }
        }
      }
      return true;
    } catch (err: any) {
      console.warn('Failed to purge demo entities from cloud:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // -------------------------------------------------------------
  // REALTIME SUBSCRIPTION
  // -------------------------------------------------------------
  const subscribeToSamitiRealtime = useCallback(
    (onRemoteChange: (payload: { table: string; eventType: string; newRow: any; oldRow: any }) => void) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel('samiti-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'samiti_donations' },
          payload => onRemoteChange({ table: 'samiti_donations', eventType: payload.eventType, newRow: payload.new, oldRow: payload.old })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'samiti_expenses' },
          payload => onRemoteChange({ table: 'samiti_expenses', eventType: payload.eventType, newRow: payload.new, oldRow: payload.old })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'samiti_events' },
          payload => onRemoteChange({ table: 'samiti_events', eventType: payload.eventType, newRow: payload.new, oldRow: payload.old })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'samiti_entities' },
          payload => onRemoteChange({ table: 'samiti_entities', eventType: payload.eventType, newRow: payload.new, oldRow: payload.old })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'samiti_cash_handovers' },
          payload => onRemoteChange({ table: 'samiti_cash_handovers', eventType: payload.eventType, newRow: payload.new, oldRow: payload.old })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'master_staff' },
          payload => onRemoteChange({ table: 'master_staff', eventType: payload.eventType, newRow: payload.new, oldRow: payload.old })
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsCloudConnected(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsCloudConnected(false);
          }
        });

      channelRef.current = channel;

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    },
    []
  );

  // -------------------------------------------------------------
  // RESET / PURGE DURGA PUJA UNIT DEMO DATA
  // -------------------------------------------------------------
  const resetDurgaPujaDataInCloud = useCallback(
    async (
      eventId: string = 'evt-durga-2026',
      reseedData?: { donations?: SamitiDonation[]; expenses?: SamitiExpense[] }
    ) => {
      try {
        setIsSyncing(true);
        const { error: donErr } = await supabase
          .from('samiti_donations')
          .delete()
          .eq('event_id', eventId);
        if (donErr) throw donErr;

        const { error: expErr } = await supabase
          .from('samiti_expenses')
          .delete()
          .eq('event_id', eventId);
        if (expErr) throw expErr;

        if (reseedData?.donations && reseedData.donations.length > 0) {
          const payload = reseedData.donations.map(d => ({
            id: d.id,
            event_id: d.eventId,
            serial_number: d.serialNumber,
            category: d.category,
            name: d.name,
            identity: d.identity || null,
            caste: d.caste || null,
            village: d.village || null,
            address1: d.address1 || null,
            address2: d.address2 || null,
            phone: d.phone || null,
            accepted_amount: d.acceptedAmount,
            received_amount: d.receivedAmount,
            balance_amount: d.balanceAmount,
            payment_mode: d.paymentMode,
            collector_name: d.collectorName || null,
            is_handover_done: d.isHandoverDone ?? false,
            date: d.date,
            remarks: d.remarks || null,
            receipt_url: d.receiptUrl || null,
            payments: d.payments ?? [],
            updated_at: new Date().toISOString(),
          }));
          await supabase.from('samiti_donations').insert(payload);
        }

        if (reseedData?.expenses && reseedData.expenses.length > 0) {
          const expPayload = reseedData.expenses.map(e => ({
            id: e.id,
            event_id: e.eventId,
            voucher_no: e.voucherNo,
            category: e.category,
            vendor_name: e.vendorName,
            vendor_phone: e.vendorPhone || null,
            total_amount: e.totalAmount,
            amount_paid: e.amountPaid,
            balance_due: e.balanceDue,
            payment_mode: e.paymentMode,
            expense_date: e.expenseDate,
            paid_by: e.paidBy || null,
            bill_receipt_url: e.billReceiptUrl || null,
            notes: e.notes || null,
          }));
          await supabase.from('samiti_expenses').insert(expPayload);
        }

        return true;
      } catch (err: any) {
        console.warn('Failed to reset Durga Puja data in cloud:', err);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  return useMemo(
    () => ({
      isSyncing,
      setIsSyncing,
      isCloudConnected,
      fetchEntitiesFromCloud,
      saveEntityToCloud,
      deleteEntityFromCloud,
      fetchEventsFromCloud,
      saveEventToCloud,
      fetchDonationsFromCloud,
      claimDonationInCloud,
      saveDonationToCloud,
      deleteDonationFromCloud,
      bulkSaveDonationsToCloud,
      fetchExpensesFromCloud,
      saveExpenseToCloud,
      deleteExpenseFromCloud,
      fetchHandoversFromCloud,
      saveHandoverToCloud,
      fetchStaffFromCloud,
      saveStaffToCloud,
      deleteStaffFromCloud,
      purgeDemoEntitiesFromCloud,
      resetDurgaPujaDataInCloud,
      subscribeToSamitiRealtime,
    }),
    [
      isSyncing,
      setIsSyncing,
      isCloudConnected,
      fetchEntitiesFromCloud,
      saveEntityToCloud,
      deleteEntityFromCloud,
      fetchEventsFromCloud,
      saveEventToCloud,
      fetchDonationsFromCloud,
      claimDonationInCloud,
      saveDonationToCloud,
      deleteDonationFromCloud,
      bulkSaveDonationsToCloud,
      fetchExpensesFromCloud,
      saveExpenseToCloud,
      deleteExpenseFromCloud,
      fetchHandoversFromCloud,
      saveHandoverToCloud,
      fetchStaffFromCloud,
      saveStaffToCloud,
      deleteStaffFromCloud,
      purgeDemoEntitiesFromCloud,
      resetDurgaPujaDataInCloud,
      subscribeToSamitiRealtime,
    ]
  );
}

