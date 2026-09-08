import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types for Supabase data
export interface DbVoter {
  id: string;
  name: string;
  phone: string | null;
  ward: number | null;
  booth: string | null;
  caste: string | null;
  status: string | null;
  has_voted: boolean | null;
  created_at: string | null;
  gender: string | null;
  age: number | null;
}

export interface DbExpense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  ward: number | null;
  date: string | null;
  created_by: string;
}

export interface DbTask {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  ward: number | null;
  due_date: string | null;
  is_completed: boolean | null;
  created_by: string | null;
}

export interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  ward: number | null;
  event_date: string | null;
  created_by: string | null;
}

export interface DbBooth {
  id: string;
  number: number;
  ward: number | null;
  name: string;
  total_voters: number | null;
  agent: string | null;
}

export interface DbInfluencer {
  id: string;
  name: string;
  type: string | null;
  ward: number | null;
  influence: string | null;
  status: string | null;
  phone: string | null;
}

export interface DbInventory {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  ward: number | null;
}

export interface DbActivity {
  id: string;
  message: string;
  type: string;
  user_name: string | null;
  created_at: string | null;
}

export interface DbCampaignSettings {
  id: string;
  total_voters: number | null;
  winning_goal: number | null;
  election_date: string | null;
  candidate_name: string | null;
  constituency: string | null;
}

// Generic hook for fetching and subscribing to a table
function useSupabaseTable<T>(
  tableName: string,
  orderBy: string = 'created_at',
  ascending: boolean = false
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: result, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order(orderBy, { ascending });

      if (error) throw error;
      setData((result as T[]) || []);
    } catch (error: any) {
      console.error(`Error fetching ${tableName}:`, error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, tableName, orderBy, ascending]);

  useEffect(() => {
    fetchData();

    // Set up realtime subscription
    let channel: RealtimeChannel | null = null;
    
    if (user) {
      channel = supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setData(prev => [payload.new as T, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setData(prev => prev.map(item => 
                (item as any).id === (payload.new as any).id ? payload.new as T : item
              ));
            } else if (payload.eventType === 'DELETE') {
              setData(prev => prev.filter(item => 
                (item as any).id !== (payload.old as any).id
              ));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, tableName, fetchData]);

  return { data, isLoading, refetch: fetchData };
}

// Voters hook
export function useVoters() {
  const { data, isLoading, refetch } = useSupabaseTable<DbVoter>('voters', 'created_at', false);
  const { user } = useAuth();

  const addVoter = useCallback(async (voter: Partial<Omit<DbVoter, 'id' | 'created_at' | 'has_voted'>> & { name: string }) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('voters')
      .insert({
        ...voter,
        has_voted: false,
        created_by: user.id,
      });

    if (error) {
      toast.error('मतदाता जोड़ने में विफल');
      console.error(error);
    } else {
      toast.success('मतदाता जोड़ा गया');
      await logActivity(`Added voter: ${voter.name}`, 'voter');
    }
  }, [user]);

  const updateVoter = useCallback(async (id: string, updates: Partial<DbVoter>) => {
    const { error } = await supabase
      .from('voters')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('अपडेट विफल');
      console.error(error);
    }
  }, []);

  const deleteVoter = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('voters')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('हटाने में विफल');
      console.error(error);
    } else {
      toast.success('मतदाता हटाया गया');
    }
  }, []);

  const markVoted = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('voters')
      .update({ has_voted: true })
      .eq('id', id);

    if (error) {
      toast.error('वोट मार्क करने में विफल');
      console.error(error);
    } else {
      toast.success('वोट मार्क किया गया');
    }
  }, []);

  return { voters: data, isLoading, refetch, addVoter, updateVoter, deleteVoter, markVoted };
}

// Expenses hook
export function useExpenses() {
  const { data, isLoading, refetch } = useSupabaseTable<DbExpense>('expenses', 'created_at', false);
  const { user } = useAuth();

  const addExpense = useCallback(async (expense: Omit<DbExpense, 'id' | 'date' | 'created_by'>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('expenses')
      .insert({
        ...expense,
        date: new Date().toISOString().split('T')[0],
        created_by: user.id,
      });

    if (error) {
      toast.error('खर्च जोड़ने में विफल');
      console.error(error);
    } else {
      toast.success('खर्च जोड़ा गया');
      await logActivity(`Expense: ${expense.description} ₹${expense.amount}`, 'expense');
    }
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('हटाने में विफल');
      console.error(error);
    } else {
      toast.success('खर्च हटाया गया');
    }
  }, []);

  return { expenses: data, isLoading, refetch, addExpense, deleteExpense };
}

// Tasks hook
export function useTasks() {
  const { data, isLoading, refetch } = useSupabaseTable<DbTask>('tasks', 'created_at', false);
  const { user } = useAuth();

  const addTask = useCallback(async (task: { title: string; description?: string; assigned_to?: string; ward?: number; due_date?: string }) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        is_completed: false,
        created_by: user.id,
      });

    if (error) {
      toast.error('कार्य जोड़ने में विफल');
      console.error(error);
    } else {
      toast.success('कार्य जोड़ा गया');
      await logActivity(`New task: ${task.title}`, 'task');
    }
  }, [user]);

  const toggleTask = useCallback(async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('अपडेट विफल');
      console.error(error);
    } else if (newStatus) {
      toast.success('कार्य पूर्ण');
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('हटाने में विफल');
      console.error(error);
    } else {
      toast.success('कार्य हटाया गया');
    }
  }, []);

  return { tasks: data, isLoading, refetch, addTask, toggleTask, deleteTask };
}

// Events hook
export function useEvents() {
  const { data, isLoading, refetch } = useSupabaseTable<DbEvent>('events', 'event_date', true);
  const { user } = useAuth();

  const addEvent = useCallback(async (event: { title: string; description?: string; location?: string; ward?: number; event_date?: string }) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('events')
      .insert({
        ...event,
        created_by: user.id,
      });

    if (error) {
      toast.error('कार्यक्रम जोड़ने में विफल');
      console.error(error);
    } else {
      toast.success('कार्यक्रम जोड़ा गया');
      await logActivity(`Event scheduled: ${event.title}`, 'event');
    }
  }, [user]);

  const deleteEvent = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('हटाने में विफल');
      console.error(error);
    } else {
      toast.success('कार्यक्रम हटाया गया');
    }
  }, []);

  return { events: data, isLoading, refetch, addEvent, deleteEvent };
}

// Booths hook
export function useBooths() {
  const { data, isLoading, refetch } = useSupabaseTable<DbBooth>('booths', 'number', true);

  const addBooth = useCallback(async (booth: Omit<DbBooth, 'id'>) => {
    const { error } = await supabase
      .from('booths')
      .insert(booth);

    if (error) {
      toast.error('बूथ जोड़ने में विफल');
      console.error(error);
    } else {
      toast.success('बूथ जोड़ा गया');
    }
  }, []);

  const updateBooth = useCallback(async (id: string, updates: Partial<DbBooth>) => {
    const { error } = await supabase
      .from('booths')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('अपडेट विफल');
      console.error(error);
    }
  }, []);

  const deleteBooth = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('booths')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('हटाने में विफल');
      console.error(error);
    } else {
      toast.success('बूथ हटाया गया');
    }
  }, []);

  return { booths: data, isLoading, refetch, addBooth, updateBooth, deleteBooth };
}

// Influencers hook
export function useInfluencers() {
  const { data, isLoading, refetch } = useSupabaseTable<DbInfluencer>('influencers', 'created_at', false);
  const { user } = useAuth();

  const addInfluencer = useCallback(async (influencer: Omit<DbInfluencer, 'id'>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('influencers')
      .insert({
        ...influencer,
        created_by: user.id,
      });

    if (error) {
      toast.error('प्रभावशाली जोड़ने में विफल');
      console.error(error);
    } else {
      toast.success('प्रभावशाली जोड़ा गया');
    }
  }, [user]);

  const updateInfluencer = useCallback(async (id: string, updates: Partial<DbInfluencer>) => {
    const { error } = await supabase
      .from('influencers')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('अपडेट विफल');
      console.error(error);
    }
  }, []);

  const deleteInfluencer = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('influencers')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('हटाने में विफल');
      console.error(error);
    } else {
      toast.success('प्रभावशाली हटाया गया');
    }
  }, []);

  return { influencers: data, isLoading, refetch, addInfluencer, updateInfluencer, deleteInfluencer };
}

// Inventory hook
export function useInventory() {
  const { data, isLoading, refetch } = useSupabaseTable<DbInventory>('inventory', 'name', true);
  const { user } = useAuth();

  const addItem = useCallback(async (item: Omit<DbInventory, 'id'>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('inventory')
      .insert({
        ...item,
        created_by: user.id,
      });

    if (error) {
      toast.error('आइटम जोड़ने में विफल');
      console.error(error);
    } else {
      toast.success('आइटम जोड़ा गया');
    }
  }, [user]);

  const updateItem = useCallback(async (id: string, updates: Partial<DbInventory>) => {
    const { error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('अपडेट विफल');
      console.error(error);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('हटाने में विफल');
      console.error(error);
    } else {
      toast.success('आइटम हटाया गया');
    }
  }, []);

  return { inventory: data, isLoading, refetch, addItem, updateItem, deleteItem };
}

// Activities hook
export function useActivities() {
  const { data, isLoading, refetch } = useSupabaseTable<DbActivity>('activities', 'created_at', false);
  return { activities: data.slice(0, 50), isLoading, refetch };
}

// Campaign Settings hook
export function useCampaignSettings() {
  const [settings, setSettings] = useState<DbCampaignSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('campaign_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error: any) {
      console.error('Error fetching settings:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();

    // Set up realtime subscription
    let channel: RealtimeChannel | null = null;
    
    if (user) {
      channel = supabase
        .channel('campaign_settings_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'campaign_settings' },
          () => {
            fetchSettings();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<DbCampaignSettings>) => {
    if (!settings?.id) {
      // Create new settings
      const { error } = await supabase
        .from('campaign_settings')
        .insert(updates);

      if (error) {
        toast.error('सेटिंग्स सेव करने में विफल');
        console.error(error);
      } else {
        toast.success('सेटिंग्स सेव की गईं');
        fetchSettings();
      }
    } else {
      // Update existing
      const { error } = await supabase
        .from('campaign_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) {
        toast.error('सेटिंग्स अपडेट करने में विफल');
        console.error(error);
      } else {
        toast.success('सेटिंग्स अपडेट की गईं');
      }
    }
  }, [settings, fetchSettings]);

  return { settings, isLoading, refetch: fetchSettings, updateSettings };
}

// Helper function to log activity
async function logActivity(message: string, type: 'voter' | 'expense' | 'task' | 'event') {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  // Get username from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user.id)
    .maybeSingle();

  await supabase
    .from('activities')
    .insert({
      message,
      type,
      user_name: profile?.full_name || profile?.username || 'Unknown',
      user_id: user.id,
    });
}
