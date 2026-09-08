import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { TabType } from '@/types/victory';
import { 
  useVoters, 
  useExpenses, 
  useTasks, 
  useEvents, 
  useBooths, 
  useInfluencers, 
  useInventory, 
  useActivities,
  useCampaignSettings,
  DbVoter,
  DbExpense,
  DbTask,
  DbEvent,
  DbBooth,
  DbInfluencer,
  DbInventory,
  DbActivity,
  DbCampaignSettings
} from '@/hooks/useSupabaseData';

// Transform DB types to legacy types for backward compatibility
interface LegacyVoter {
  id: string;
  name: string;
  phone: string;
  ward: number;
  booth: number;
  caste: string;
  status: 'support' | 'oppose' | 'neutral';
  hasVoted: boolean;
  createdAt: string;
}

interface LegacyExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  ward: number;
  date: string;
}

interface LegacyTask {
  id: string;
  title: string;
  assignedTo: string;
  ward: number;
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface LegacyEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  ward: number;
  type: 'rally' | 'meeting' | 'padyatra' | 'other';
  location: string;
}

interface LegacyBooth {
  id: string;
  number: number;
  ward: number;
  name: string;
  totalVoters: number;
  agent: string;
}

interface LegacyInfluencer {
  id: string;
  name: string;
  type: string;
  ward: number;
  influence: 'high' | 'medium' | 'low';
  status: 'support' | 'oppose' | 'neutral';
  phone: string;
}

interface LegacyInventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  ward: number;
}

interface LegacyActivity {
  id: string;
  message: string;
  timestamp: string;
  type: 'voter' | 'expense' | 'task' | 'event';
  user: string;
}

interface LegacyWardData {
  id: number;
  name: string;
  totalVoters: number;
  supporters: number;
  opponents: number;
  neutral: number;
  expenses: number;
}

interface LegacySettings {
  totalVoters: number;
  winningGoal: number;
  daysLeft: number;
  electionDate: string;
  candidateName: string;
  constituency: string;
}

interface LegacyData {
  settings: LegacySettings;
  voters: LegacyVoter[];
  booths: LegacyBooth[];
  influencers: LegacyInfluencer[];
  expenses: LegacyExpense[];
  inventory: LegacyInventoryItem[];
  tasks: LegacyTask[];
  karyakartas: { id: string; name: string; phone: string; ward: number; tasksCompleted: number; role: string }[];
  events: LegacyEvent[];
  wards: LegacyWardData[];
  activities: LegacyActivity[];
  pollData: { time: string; votes: number }[];
}

interface VictoryContextType {
  data: LegacyData;
  isLoading: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pollingMode: boolean;
  setPollingMode: (mode: boolean) => void;
  
  // Voter actions
  addVoter: (voter: Omit<LegacyVoter, 'id' | 'createdAt' | 'hasVoted'>) => Promise<void>;
  updateVoter: (id: string, updates: Partial<LegacyVoter>) => Promise<void>;
  deleteVoter: (id: string) => Promise<void>;
  markVoted: (id: string) => Promise<void>;
  
  // Expense actions
  addExpense: (expense: Omit<LegacyExpense, 'id' | 'date'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Task actions
  addTask: (task: Omit<LegacyTask, 'id'>) => Promise<void>;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => Promise<void>;
  
  // Inventory actions
  addInventoryItem: (item: Omit<LegacyInventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<LegacyInventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  
  // Event actions
  addEvent: (event: Omit<LegacyEvent, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  // Influencer actions
  addInfluencer: (influencer: Omit<LegacyInfluencer, 'id'>) => Promise<void>;
  updateInfluencer: (id: string, updates: Partial<LegacyInfluencer>) => Promise<void>;
  deleteInfluencer: (id: string) => Promise<void>;
  
  // Settings actions
  updateSettings: (settings: Partial<LegacySettings>) => Promise<void>;
  
  // Data management (legacy support)
  exportDataFile: () => void;
  importDataFile: (file: File) => Promise<void>;
  factoryReset: () => void;
  
  // Computed values
  totalSupporters: number;
  totalExpenses: number;
  completedTasks: number;
}

const VictoryContext = createContext<VictoryContextType | undefined>(undefined);

// Transform functions
function transformVoter(v: DbVoter): LegacyVoter {
  return {
    id: v.id,
    name: v.name,
    phone: v.phone || '',
    ward: v.ward || 0,
    booth: parseInt(v.booth || '0') || 0,
    caste: v.caste || '',
    status: (v.status as 'support' | 'oppose' | 'neutral') || 'neutral',
    hasVoted: v.has_voted || false,
    createdAt: v.created_at || new Date().toISOString(),
  };
}

function transformExpense(e: DbExpense): LegacyExpense {
  return {
    id: e.id,
    description: e.description,
    amount: Number(e.amount),
    category: e.category || 'Other',
    ward: e.ward || 0,
    date: e.date || new Date().toISOString(),
  };
}

function transformTask(t: DbTask): LegacyTask {
  return {
    id: t.id,
    title: t.title,
    assignedTo: t.assigned_to || 'Unassigned',
    ward: t.ward || 0,
    dueDate: t.due_date || '',
    completed: t.is_completed || false,
    priority: 'medium' as const,
  };
}

function transformEvent(e: DbEvent): LegacyEvent {
  const eventDate = e.event_date ? new Date(e.event_date) : new Date();
  return {
    id: e.id,
    title: e.title,
    date: eventDate.toISOString().split('T')[0],
    time: eventDate.toTimeString().slice(0, 5),
    ward: e.ward || 0,
    type: 'other' as const,
    location: e.location || '',
  };
}

function transformBooth(b: DbBooth): LegacyBooth {
  return {
    id: b.id,
    number: b.number,
    ward: b.ward || 0,
    name: b.name,
    totalVoters: b.total_voters || 0,
    agent: b.agent || '',
  };
}

function transformInfluencer(i: DbInfluencer): LegacyInfluencer {
  return {
    id: i.id,
    name: i.name,
    type: i.type || '',
    ward: i.ward || 0,
    influence: (i.influence as 'high' | 'medium' | 'low') || 'medium',
    status: (i.status as 'support' | 'oppose' | 'neutral') || 'neutral',
    phone: i.phone || '',
  };
}

function transformInventory(i: DbInventory): LegacyInventoryItem {
  return {
    id: i.id,
    name: i.name,
    quantity: i.quantity || 0,
    unit: i.unit || 'pieces',
    ward: i.ward || 0,
  };
}

function transformActivity(a: DbActivity): LegacyActivity {
  return {
    id: a.id,
    message: a.message,
    timestamp: a.created_at || new Date().toISOString(),
    type: a.type as 'voter' | 'expense' | 'task' | 'event',
    user: a.user_name || 'Unknown',
  };
}

export const VictoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [pollingMode, setPollingMode] = useState(false);

  // Supabase hooks
  const { voters: dbVoters, isLoading: votersLoading, addVoter: addDbVoter, updateVoter: updateDbVoter, deleteVoter: deleteDbVoter, markVoted: markDbVoted } = useVoters();
  const { expenses: dbExpenses, isLoading: expensesLoading, addExpense: addDbExpense, deleteExpense: deleteDbExpense } = useExpenses();
  const { tasks: dbTasks, isLoading: tasksLoading, addTask: addDbTask, toggleTask: toggleDbTask, deleteTask: deleteDbTask } = useTasks();
  const { events: dbEvents, isLoading: eventsLoading, addEvent: addDbEvent, deleteEvent: deleteDbEvent } = useEvents();
  const { booths: dbBooths, isLoading: boothsLoading } = useBooths();
  const { influencers: dbInfluencers, isLoading: influencersLoading, addInfluencer: addDbInfluencer, updateInfluencer: updateDbInfluencer, deleteInfluencer: deleteDbInfluencer } = useInfluencers();
  const { inventory: dbInventory, isLoading: inventoryLoading, addItem: addDbItem, updateItem: updateDbItem, deleteItem: deleteDbItem } = useInventory();
  const { activities: dbActivities, isLoading: activitiesLoading } = useActivities();
  const { settings: dbSettings, isLoading: settingsLoading, updateSettings: updateDbSettings } = useCampaignSettings();

  const isLoading = votersLoading || expensesLoading || tasksLoading || eventsLoading || boothsLoading || influencersLoading || inventoryLoading || activitiesLoading || settingsLoading;

  // Transform DB data to legacy format
  const voters = useMemo(() => dbVoters.map(transformVoter), [dbVoters]);
  const expenses = useMemo(() => dbExpenses.map(transformExpense), [dbExpenses]);
  const tasks = useMemo(() => dbTasks.map(transformTask), [dbTasks]);
  const events = useMemo(() => dbEvents.map(transformEvent), [dbEvents]);
  const booths = useMemo(() => dbBooths.map(transformBooth), [dbBooths]);
  const influencers = useMemo(() => dbInfluencers.map(transformInfluencer), [dbInfluencers]);
  const inventory = useMemo(() => dbInventory.map(transformInventory), [dbInventory]);
  const activities = useMemo(() => dbActivities.map(transformActivity), [dbActivities]);

  // Calculate days left
  const daysLeft = useMemo(() => {
    if (!dbSettings?.election_date) return 15;
    const electionDate = new Date(dbSettings.election_date);
    const today = new Date();
    const diff = Math.ceil((electionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [dbSettings?.election_date]);

  // Settings with defaults
  const settings: LegacySettings = useMemo(() => ({
    totalVoters: dbSettings?.total_voters || voters.length || 8500,
    winningGoal: dbSettings?.winning_goal || 4500,
    daysLeft,
    electionDate: dbSettings?.election_date || '2025-01-20',
    candidateName: dbSettings?.candidate_name || 'प्रत्याशी',
    constituency: dbSettings?.constituency || 'क्षेत्र',
  }), [dbSettings, voters.length, daysLeft]);

  // Calculate ward data from voters
  const wards: LegacyWardData[] = useMemo(() => {
    const wardMap = new Map<number, { supporters: number; opponents: number; neutral: number; total: number }>();
    
    // Initialize 13 wards
    for (let i = 1; i <= 13; i++) {
      wardMap.set(i, { supporters: 0, opponents: 0, neutral: 0, total: 0 });
    }

    // Count voters by ward
    voters.forEach(v => {
      const ward = wardMap.get(v.ward);
      if (ward) {
        ward.total++;
        if (v.status === 'support') ward.supporters++;
        else if (v.status === 'oppose') ward.opponents++;
        else ward.neutral++;
      }
    });

    // Calculate expenses by ward
    const expensesByWard = new Map<number, number>();
    expenses.forEach(e => {
      const current = expensesByWard.get(e.ward) || 0;
      expensesByWard.set(e.ward, current + e.amount);
    });

    return Array.from({ length: 13 }, (_, i) => {
      const wardId = i + 1;
      const data = wardMap.get(wardId) || { supporters: 0, opponents: 0, neutral: 0, total: 0 };
      return {
        id: wardId,
        name: `Ward ${wardId}`,
        totalVoters: data.total || 500 + Math.floor(Math.random() * 300),
        supporters: data.supporters || 200 + Math.floor(Math.random() * 150),
        opponents: data.opponents || 50 + Math.floor(Math.random() * 100),
        neutral: data.neutral || 150 + Math.floor(Math.random() * 100),
        expenses: expensesByWard.get(wardId) || 0,
      };
    });
  }, [voters, expenses]);

  // Karyakartas placeholder (would need separate table)
  const karyakartas = useMemo(() => [
    { id: '1', name: 'Vikram Singh', phone: '9876543230', ward: 1, tasksCompleted: 15, role: 'Booth Agent' },
    { id: '2', name: 'Priya Kumari', phone: '9876543231', ward: 2, tasksCompleted: 12, role: 'Ward Incharge' },
    { id: '3', name: 'Santosh Yadav', phone: '9876543232', ward: 3, tasksCompleted: 10, role: 'Youth Coordinator' },
  ], []);

  // Poll data placeholder
  const pollData = useMemo(() => [
    { time: '9 AM', votes: 0 },
    { time: '10 AM', votes: 450 },
    { time: '11 AM', votes: 1200 },
    { time: '12 PM', votes: 2100 },
    { time: '1 PM', votes: 2800 },
    { time: '2 PM', votes: 3500 },
    { time: '3 PM', votes: 4200 },
    { time: '4 PM', votes: 4800 },
    { time: '5 PM', votes: 5200 },
  ], []);

  // Combine into legacy data structure
  const data: LegacyData = useMemo(() => ({
    settings,
    voters,
    booths,
    influencers,
    expenses,
    inventory,
    tasks,
    karyakartas,
    events,
    wards,
    activities,
    pollData,
  }), [settings, voters, booths, influencers, expenses, inventory, tasks, karyakartas, events, wards, activities, pollData]);

  // Voter actions
  const addVoter = useCallback(async (voter: Omit<LegacyVoter, 'id' | 'createdAt' | 'hasVoted'>) => {
    await addDbVoter({
      name: voter.name,
      phone: voter.phone || null,
      ward: voter.ward || null,
      booth: voter.booth?.toString() || null,
      caste: voter.caste || null,
      status: voter.status || 'neutral',
      gender: null,
      age: null,
    });
  }, [addDbVoter]);

  const updateVoter = useCallback(async (id: string, updates: Partial<LegacyVoter>) => {
    const dbUpdates: Partial<DbVoter> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.ward) dbUpdates.ward = updates.ward;
    if (updates.booth) dbUpdates.booth = updates.booth.toString();
    if (updates.caste) dbUpdates.caste = updates.caste;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.hasVoted !== undefined) dbUpdates.has_voted = updates.hasVoted;
    await updateDbVoter(id, dbUpdates);
  }, [updateDbVoter]);

  const deleteVoter = useCallback(async (id: string) => {
    await deleteDbVoter(id);
  }, [deleteDbVoter]);

  const markVoted = useCallback(async (id: string) => {
    await markDbVoted(id);
  }, [markDbVoted]);

  // Expense actions
  const addExpense = useCallback(async (expense: Omit<LegacyExpense, 'id' | 'date'>) => {
    await addDbExpense({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      ward: expense.ward,
    });
  }, [addDbExpense]);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteDbExpense(id);
  }, [deleteDbExpense]);

  // Task actions
  const addTask = useCallback(async (task: Omit<LegacyTask, 'id'>) => {
    await addDbTask({
      title: task.title,
      assigned_to: task.assignedTo,
      ward: task.ward,
      due_date: task.dueDate,
    });
  }, [addDbTask]);

  const toggleTask = useCallback((id: string) => {
    const task = dbTasks.find(t => t.id === id);
    if (task) {
      toggleDbTask(id, task.is_completed || false);
    }
  }, [dbTasks, toggleDbTask]);

  const deleteTask = useCallback(async (id: string) => {
    await deleteDbTask(id);
  }, [deleteDbTask]);

  // Inventory actions
  const addInventoryItem = useCallback(async (item: Omit<LegacyInventoryItem, 'id'>) => {
    await addDbItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      ward: item.ward,
    });
  }, [addDbItem]);

  const updateInventoryItem = useCallback(async (id: string, updates: Partial<LegacyInventoryItem>) => {
    const dbUpdates: Partial<DbInventory> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.unit) dbUpdates.unit = updates.unit;
    if (updates.ward) dbUpdates.ward = updates.ward;
    await updateDbItem(id, dbUpdates);
  }, [updateDbItem]);

  const deleteInventoryItem = useCallback(async (id: string) => {
    await deleteDbItem(id);
  }, [deleteDbItem]);

  // Event actions
  const addEvent = useCallback(async (event: Omit<LegacyEvent, 'id'>) => {
    const eventDate = new Date(`${event.date}T${event.time || '00:00'}`);
    await addDbEvent({
      title: event.title,
      location: event.location,
      ward: event.ward,
      event_date: eventDate.toISOString(),
    });
  }, [addDbEvent]);

  const deleteEvent = useCallback(async (id: string) => {
    await deleteDbEvent(id);
  }, [deleteDbEvent]);

  // Influencer actions
  const addInfluencer = useCallback(async (influencer: Omit<LegacyInfluencer, 'id'>) => {
    await addDbInfluencer({
      name: influencer.name,
      type: influencer.type,
      ward: influencer.ward,
      influence: influencer.influence,
      status: influencer.status,
      phone: influencer.phone,
    });
  }, [addDbInfluencer]);

  const updateInfluencer = useCallback(async (id: string, updates: Partial<LegacyInfluencer>) => {
    const dbUpdates: Partial<DbInfluencer> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.ward) dbUpdates.ward = updates.ward;
    if (updates.influence) dbUpdates.influence = updates.influence;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.phone) dbUpdates.phone = updates.phone;
    await updateDbInfluencer(id, dbUpdates);
  }, [updateDbInfluencer]);

  const deleteInfluencer = useCallback(async (id: string) => {
    await deleteDbInfluencer(id);
  }, [deleteDbInfluencer]);

  // Settings actions
  const updateSettings = useCallback(async (newSettings: Partial<LegacySettings>) => {
    const dbUpdates: Partial<DbCampaignSettings> = {};
    if (newSettings.totalVoters) dbUpdates.total_voters = newSettings.totalVoters;
    if (newSettings.winningGoal) dbUpdates.winning_goal = newSettings.winningGoal;
    if (newSettings.electionDate) dbUpdates.election_date = newSettings.electionDate;
    if (newSettings.candidateName) dbUpdates.candidate_name = newSettings.candidateName;
    if (newSettings.constituency) dbUpdates.constituency = newSettings.constituency;
    await updateDbSettings(dbUpdates);
  }, [updateDbSettings]);

  // Legacy data management (kept for backward compatibility)
  const exportDataFile = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `victory_os_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importDataFile = useCallback(async (file: File) => {
    // Legacy import - not supported with Supabase backend
    console.warn('Import not supported with cloud backend');
  }, []);

  const factoryReset = useCallback(() => {
    // Legacy reset - not supported with Supabase backend
    console.warn('Factory reset not supported with cloud backend');
  }, []);

  // Computed values
  const totalSupporters = useMemo(() => voters.filter(v => v.status === 'support').length, [voters]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);

  return (
    <VictoryContext.Provider
      value={{
        data,
        isLoading,
        activeTab,
        setActiveTab,
        pollingMode,
        setPollingMode,
        addVoter,
        updateVoter,
        deleteVoter,
        markVoted,
        addExpense,
        deleteExpense,
        addTask,
        toggleTask,
        deleteTask,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addEvent,
        deleteEvent,
        addInfluencer,
        updateInfluencer,
        deleteInfluencer,
        updateSettings,
        exportDataFile,
        importDataFile,
        factoryReset,
        totalSupporters,
        totalExpenses,
        completedTasks,
      }}
    >
      {children}
    </VictoryContext.Provider>
  );
};

export const useVictory = () => {
  const context = useContext(VictoryContext);
  if (!context) {
    throw new Error('useVictory must be used within a VictoryProvider');
  }
  return context;
};
