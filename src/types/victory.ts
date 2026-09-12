export interface Voter {
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

export interface Booth {
  id: string;
  number: number;
  ward: number;
  name: string;
  totalVoters: number;
  agent: string;
}

export interface Influencer {
  id: string;
  name: string;
  type: string;
  ward: number;
  influence: 'high' | 'medium' | 'low';
  status: 'support' | 'oppose' | 'neutral';
  phone: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  ward: number;
  date: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  ward: number;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  ward: number;
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface Karyakarta {
  id: string;
  name: string;
  phone: string;
  ward: number;
  tasksCompleted: number;
  role: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  ward: number;
  type: 'rally' | 'meeting' | 'padyatra' | 'other';
  location: string;
}

export interface WardData {
  id: number;
  name: string;
  totalVoters: number;
  supporters: number;
  opponents: number;
  neutral: number;
  expenses: number;
}

export interface Activity {
  id: string;
  message: string;
  timestamp: string;
  type: 'voter' | 'expense' | 'task' | 'event';
  user: string;
}

export interface VictoryData {
  settings: {
    totalVoters: number;
    winningGoal: number;
    daysLeft: number;
    electionDate: string;
    candidateName: string;
    constituency: string;
  };
  voters: Voter[];
  booths: Booth[];
  influencers: Influencer[];
  expenses: Expense[];
  inventory: InventoryItem[];
  tasks: Task[];
  karyakartas: Karyakarta[];
  events: Event[];
  wards: WardData[];
  activities: Activity[];
  pollData: { time: string; votes: number }[];
}

export type TabType = 'dashboard' | 'crm' | 'ops' | 'strategy' | 'ground' | 'settings';
