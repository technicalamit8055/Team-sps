import { useState, useEffect, useCallback, useRef } from 'react';
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

export function useSamitiDatabase() {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

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
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Network error fetching donations:', err);
      return null;
    }
  }, []);

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
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to upsert donation to Supabase:', err.message);
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
        createdAt: item.created_at || new Date().toISOString(),
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
        password: item.password_hash || undefined,
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

  const saveStaffToCloud = useCallback(async (staff: MasterStaff) => {
    try {
      const { error } = await supabase.from('master_staff').upsert({
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        email: staff.email || null,
        username: staff.username,
        password_hash: staff.password || null,
        primary_role: staff.primaryRole,
        designation: staff.designation || null,
        status: staff.status,
        joined_date: staff.joinedDate,
        avatar_color: staff.avatarColor || null,
        workspace_permissions: staff.workspacePermissions as any,
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to upsert staff to Supabase:', err.message);
    }
  }, []);

  const deleteStaffFromCloud = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('master_staff').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to delete staff from Supabase:', err.message);
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

  return {
    isSyncing,
    setIsSyncing,
    isCloudConnected,
    fetchEntitiesFromCloud,
    saveEntityToCloud,
    deleteEntityFromCloud,
    fetchEventsFromCloud,
    saveEventToCloud,
    fetchDonationsFromCloud,
    saveDonationToCloud,
    deleteDonationFromCloud,
    bulkSaveDonationsToCloud,
    fetchExpensesFromCloud,
    saveExpenseToCloud,
    deleteExpenseFromCloud,
    fetchStaffFromCloud,
    saveStaffToCloud,
    deleteStaffFromCloud,
    subscribeToSamitiRealtime,
  };
}
