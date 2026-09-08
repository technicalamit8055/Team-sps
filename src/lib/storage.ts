import { VictoryData, Activity } from '@/types/victory';

const STORAGE_KEY = 'victory_os_data';

const defaultData: VictoryData = {
  settings: {
    totalVoters: 8500,
    winningGoal: 4500,
    daysLeft: 15,
    electionDate: '2025-01-20',
    candidateName: 'Shri Rajesh Kumar',
    constituency: 'Maheshpur Panchayat',
  },
  voters: [
    { id: '1', name: 'Ramesh Prasad', phone: '9876543210', ward: 1, booth: 101, caste: 'OBC', status: 'support', hasVoted: false, createdAt: new Date().toISOString() },
    { id: '2', name: 'Sunita Devi', phone: '9876543211', ward: 1, booth: 101, caste: 'General', status: 'support', hasVoted: false, createdAt: new Date().toISOString() },
    { id: '3', name: 'Mohan Lal', phone: '9876543212', ward: 2, booth: 102, caste: 'SC', status: 'neutral', hasVoted: false, createdAt: new Date().toISOString() },
    { id: '4', name: 'Geeta Singh', phone: '9876543213', ward: 3, booth: 103, caste: 'OBC', status: 'oppose', hasVoted: false, createdAt: new Date().toISOString() },
    { id: '5', name: 'Anil Kumar', phone: '9876543214', ward: 2, booth: 102, caste: 'General', status: 'support', hasVoted: false, createdAt: new Date().toISOString() },
  ],
  booths: [
    { id: '1', number: 101, ward: 1, name: 'Primary School Booth', totalVoters: 650, agent: 'Rajesh Kumar' },
    { id: '2', number: 102, ward: 2, name: 'Community Center', totalVoters: 720, agent: 'Sunita Sharma' },
    { id: '3', number: 103, ward: 3, name: 'Panchayat Bhawan', totalVoters: 580, agent: 'Mohan Singh' },
  ],
  influencers: [
    { id: '1', name: 'Pandit Ramji', type: 'Religious', ward: 1, influence: 'high', status: 'support', phone: '9876543220' },
    { id: '2', name: 'Dr. Sharma', type: 'Medical', ward: 2, influence: 'high', status: 'neutral', phone: '9876543221' },
    { id: '3', name: 'Masterji', type: 'Teacher', ward: 3, influence: 'medium', status: 'support', phone: '9876543222' },
  ],
  expenses: [
    { id: '1', description: 'Banner Printing', amount: 15000, category: 'Publicity', ward: 0, date: new Date().toISOString() },
    { id: '2', description: 'Tea & Snacks - Rally', amount: 5000, category: 'Events', ward: 1, date: new Date().toISOString() },
    { id: '3', description: 'Vehicle Fuel', amount: 3000, category: 'Transport', ward: 0, date: new Date().toISOString() },
  ],
  inventory: [
    { id: '1', name: 'Party Flags', quantity: 500, unit: 'pieces', ward: 0 },
    { id: '2', name: 'Posters', quantity: 2000, unit: 'pieces', ward: 0 },
    { id: '3', name: 'Pamphlets', quantity: 5000, unit: 'pieces', ward: 0 },
    { id: '4', name: 'Caps', quantity: 300, unit: 'pieces', ward: 0 },
  ],
  tasks: [
    { id: '1', title: 'Door-to-door campaign Ward 1', assignedTo: 'Team A', ward: 1, dueDate: '2025-01-10', completed: false, priority: 'high' },
    { id: '2', title: 'Distribute pamphlets Ward 2', assignedTo: 'Team B', ward: 2, dueDate: '2025-01-08', completed: true, priority: 'medium' },
    { id: '3', title: 'Meet village elders Ward 3', assignedTo: 'Candidate', ward: 3, dueDate: '2025-01-12', completed: false, priority: 'high' },
  ],
  karyakartas: [
    { id: '1', name: 'Vikram Singh', phone: '9876543230', ward: 1, tasksCompleted: 15, role: 'Booth Agent' },
    { id: '2', name: 'Priya Kumari', phone: '9876543231', ward: 2, tasksCompleted: 12, role: 'Ward Incharge' },
    { id: '3', name: 'Santosh Yadav', phone: '9876543232', ward: 3, tasksCompleted: 10, role: 'Youth Coordinator' },
  ],
  events: [
    { id: '1', title: 'Nukkad Sabha', date: '2025-01-08', time: '16:00', ward: 1, type: 'rally', location: 'Main Chowk' },
    { id: '2', title: 'Mahila Sammelan', date: '2025-01-10', time: '11:00', ward: 2, type: 'meeting', location: 'Community Hall' },
  ],
  wards: Array.from({ length: 13 }, (_, i) => ({
    id: i + 1,
    name: `Ward ${i + 1}`,
    totalVoters: 500 + Math.floor(Math.random() * 300),
    supporters: 200 + Math.floor(Math.random() * 150),
    opponents: 50 + Math.floor(Math.random() * 100),
    neutral: 150 + Math.floor(Math.random() * 100),
    expenses: Math.floor(Math.random() * 20000),
  })),
  activities: [
    { id: '1', message: 'Ramesh added new voter Sunita Devi', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'voter', user: 'Ramesh' },
    { id: '2', message: 'Expense recorded: Banner Printing ₹15,000', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'expense', user: 'Admin' },
    { id: '3', message: 'Task completed: Pamphlet distribution', timestamp: new Date(Date.now() - 10800000).toISOString(), type: 'task', user: 'Team B' },
  ],
  pollData: [
    { time: '9 AM', votes: 0 },
    { time: '10 AM', votes: 450 },
    { time: '11 AM', votes: 1200 },
    { time: '12 PM', votes: 2100 },
    { time: '1 PM', votes: 2800 },
    { time: '2 PM', votes: 3500 },
    { time: '3 PM', votes: 4200 },
    { time: '4 PM', votes: 4800 },
    { time: '5 PM', votes: 5200 },
  ],
};

export const loadData = (): VictoryData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return defaultData;
};

export const saveData = (data: VictoryData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const addActivity = (data: VictoryData, activity: Omit<Activity, 'id' | 'timestamp'>): VictoryData => {
  const newActivity: Activity = {
    ...activity,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  
  return {
    ...data,
    activities: [newActivity, ...data.activities].slice(0, 50),
  };
};

export const exportData = (data: VictoryData): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `victory_os_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<VictoryData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const resetData = (): VictoryData => {
  localStorage.removeItem(STORAGE_KEY);
  return defaultData;
};
