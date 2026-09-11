import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  MasterEntity,
  SamitiEvent,
  SamitiDonation,
  SamitiExpense,
  SamitiFinancialSummary,
  DonationCategory,
  PaymentMode,
  ExpenseCategory,
} from '@/types/samiti';
import {
  MasterStaff,
  WorkspaceAccessLevel,
  WorkspacePermission,
  ModuleAccess,
  DEFAULT_MODULE_ACCESS_MAP,
} from '@/types/master';
import { toast } from 'sonner';
import { useSamitiDatabase } from '@/hooks/useSamitiDatabase';

const DEFAULT_ENTITIES: MasterEntity[] = [
  {
    id: 'ent-durga-narayanpur',
    name: 'श्री दुर्गा पूजा समिति, नारायणपुर',
    type: 'festival_samiti',
    upiId: 'durgapuja.narayanpur@upi',
    tagline: 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।',
    location: 'मुख्य चौक, नारायणपुर',
    establishedYear: 1985,
  },
  {
    id: 'ent-election-2026',
    name: '🗳️ चुनाव अभियान प्रबंधन (Victory OS Election Command)',
    type: 'election',
    upiId: 'campaign.victory@upi',
    tagline: 'मिशन विजय 2026 • बूथ प्रबंधन, मतदाता CRM, वॉर रूम एवं रणनीतिकार AI',
    location: 'नारायणपुर विधानसभा क्षेत्र',
    establishedYear: 2026,
  },
];

const DEFAULT_EVENTS: SamitiEvent[] = [
  {
    id: 'evt-durga-2026',
    entityId: 'ent-durga-narayanpur',
    title: 'श्री दुर्गा पूजा महोत्सव 2026 (भव्य 41वाँ वार्षिकोत्सव)',
    fiscalYear: '2026-27',
    targetBudget: 550000,
    startDate: '2026-10-15',
    endDate: '2026-10-24',
    isActive: true,
  },
  {
    id: 'evt-election-2026',
    entityId: 'ent-election-2026',
    title: 'विधानसभा चुनाव अभियान 2026 (War Room & Voter CRM)',
    fiscalYear: '2026-27',
    targetBudget: 2500000,
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    isActive: true,
  },
];

// Seed sample records reflecting the real-life Durga Puja Samiti Narayanpur sheet
const SEED_DONATIONS: SamitiDonation[] = [
  {
    id: 'don-1',
    eventId: 'evt-durga-2026',
    serialNumber: 1,
    category: 'SHO',
    name: 'राजेश कुमार गुप्ता',
    identity: 'प्रो०: गुप्ता वस्त्र भंडार',
    caste: 'वैश्य',
    address1: 'दुकान नं० 14, मुख्य बाजार',
    address2: 'नारायणपुर चौराहा',
    phone: '9835012345',
    acceptedAmount: 11000,
    receivedAmount: 11000,
    balanceAmount: 0,
    paymentMode: 'ONL',
    collectorName: 'अमित कुमार (सचिव)',
    isHandoverDone: true,
    date: '2026-09-01',
    remarks: 'गूगल पे द्वारा प्राप्त',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'don-2',
    eventId: 'evt-durga-2026',
    serialNumber: 2,
    category: 'VIL',
    name: 'रामनरेश सिंह',
    identity: 'आत्मज: स्वर्गीय रामखेलावन सिंह',
    caste: 'क्षत्रिय',
    address1: 'वार्ड नं० 4, सिंह टोला',
    address2: 'पोस्ट- नारायणपुर',
    phone: '9470123456',
    acceptedAmount: 5100,
    receivedAmount: 3100,
    balanceAmount: 2000,
    paymentMode: 'CASH',
    collectorName: 'सुनील वर्मा',
    isHandoverDone: true,
    date: '2026-09-02',
    remarks: 'सप्तमी को ₹2000 शेष देंगे',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'don-3',
    eventId: 'evt-durga-2026',
    serialNumber: 3,
    category: 'EMP',
    name: 'डॉ० विकास रंजन',
    identity: 'चिकित्सा पदाधिकारी, प्राथमिक स्वास्थ्य केंद्र',
    caste: 'ब्राह्मण',
    address1: 'क्वार्टर नं० 2, पीएचसी परिसर',
    address2: 'नारायणपुर',
    phone: '9123456789',
    acceptedAmount: 5100,
    receivedAmount: 5100,
    balanceAmount: 0,
    paymentMode: 'ONL',
    collectorName: 'प्रमोद यादव',
    isHandoverDone: true,
    date: '2026-09-02',
    remarks: 'फोनपे द्वारा अंतरित',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'don-4',
    eventId: 'evt-durga-2026',
    serialNumber: 4,
    category: 'SHO',
    name: 'महेश मिष्ठान्न भंडार (महेश शाह)',
    identity: 'दुकानदार संघ उपाध्यक्ष',
    caste: 'साहू',
    address1: 'स्टेशन रोड',
    address2: 'नारायणपुर',
    phone: '9801234567',
    acceptedAmount: 15000,
    receivedAmount: 5000,
    balanceAmount: 10000,
    paymentMode: 'CASH',
    collectorName: 'अमित कुमार (सचिव)',
    isHandoverDone: false,
    date: '2026-09-03',
    remarks: 'भोग प्रसाद सामग्री भी देंगे + शेष ₹10,000 नवमी को',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'don-5',
    eventId: 'evt-durga-2026',
    serialNumber: 5,
    category: 'VIL',
    name: 'संजय कुमार महतो',
    identity: 'पुत्र: सुखदेव महतो',
    caste: 'कुर्मी',
    address1: 'ग्राम- नारायणपुर पूर्वी',
    address2: 'थाना- सदर',
    phone: '9934567890',
    acceptedAmount: 2100,
    receivedAmount: 2100,
    balanceAmount: 0,
    paymentMode: 'CASH',
    collectorName: 'दीपक कुमार',
    isHandoverDone: true,
    date: '2026-09-03',
    remarks: 'ससम्मान रसीद दी गई',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'don-6',
    eventId: 'evt-durga-2026',
    serialNumber: 6,
    category: 'OTH',
    name: 'प्रवीण आनंद (NRI/बेंगलुरु)',
    identity: 'सॉफ्टवेयर इंजीनियर (मूल निवासी)',
    caste: 'कायस्थ',
    address1: 'आनंद निवास',
    address2: 'नारायणपुर',
    phone: '9876543210',
    acceptedAmount: 21000,
    receivedAmount: 21000,
    balanceAmount: 0,
    paymentMode: 'ONL',
    collectorName: 'अमित कुमार (सचिव)',
    isHandoverDone: true,
    date: '2026-09-04',
    remarks: 'सीधे बैंक खाते में UPI ट्रान्सफर',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'don-7',
    eventId: 'evt-durga-2026',
    serialNumber: 7,
    category: 'SHO',
    name: 'न्यू भारत इलेक्ट्रॉनिक्स (सोनू सिंह)',
    identity: 'दुकानदार',
    caste: 'राजपूत',
    address1: 'मेन मार्केट रोड',
    address2: 'नारायणपुर',
    phone: '9431234567',
    acceptedAmount: 7500,
    receivedAmount: 2500,
    balanceAmount: 5000,
    paymentMode: 'CASH',
    collectorName: 'सुनील वर्मा',
    isHandoverDone: false,
    date: '2026-09-05',
    remarks: 'अष्टमी को शेष राशि वसूली जाएगी',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'don-8',
    eventId: 'evt-durga-2026',
    serialNumber: 8,
    category: 'EMP',
    name: 'सुभाष चन्द्र झा',
    identity: 'वरिष्ठ शिक्षक, राजकीय उच्च विद्यालय',
    caste: 'ब्राह्मण',
    address1: 'विद्यापति नगर',
    address2: 'वार्ड नं० 7, नारायणपुर',
    phone: '9835678901',
    acceptedAmount: 3100,
    receivedAmount: 3100,
    balanceAmount: 0,
    paymentMode: 'ONL',
    collectorName: 'प्रमोद यादव',
    isHandoverDone: true,
    date: '2026-09-05',
    remarks: 'QR कोड स्कैन करके भुगतान किया',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_EXPENSES: SamitiExpense[] = [
  {
    id: 'exp-1',
    eventId: 'evt-durga-2026',
    voucherNo: 'VCH-001',
    category: 'idol_murti',
    vendorName: 'मूर्तिकार विजय पाल एवं बंधु',
    vendorPhone: '9835112233',
    totalAmount: 65000,
    amountPaid: 35000,
    balanceDue: 30000,
    paymentMode: 'CASH',
    expenseDate: '2026-08-25',
    paidBy: 'कोषाध्यक्ष (मनोज कुमार)',
    notes: 'भव्य 15 फीट माँ दुर्गा व महिषासुर मर्दिनी प्रतिमा अग्रिम',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    eventId: 'evt-durga-2026',
    voucherNo: 'VCH-002',
    category: 'pandal_tent',
    vendorName: 'भवानी टेंट हाउस & डेकोरेटर्स',
    vendorPhone: '9470223344',
    totalAmount: 145000,
    amountPaid: 50000,
    balanceDue: 95000,
    paymentMode: 'ONL',
    expenseDate: '2026-09-01',
    paidBy: 'सचिव (अमित कुमार)',
    notes: 'अक्षरधाम मंदिर प्रारूप भव्य वाटरप्रूफ पंडाल निर्माण हेतु अग्रिम',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    eventId: 'evt-durga-2026',
    voucherNo: 'VCH-003',
    category: 'sound_light',
    vendorName: 'माँ अम्बे म्यूजिकल & लाइट डेकोरेशन',
    vendorPhone: '9123334455',
    totalAmount: 55000,
    amountPaid: 20000,
    balanceDue: 35000,
    paymentMode: 'CASH',
    expenseDate: '2026-09-02',
    paidBy: 'कोषाध्यक्ष (मनोज कुमार)',
    notes: 'जेबीएल साउंड सिस्टम, तोरण द्वार लाइट व हैलोजन फिटिंग',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-4',
    eventId: 'evt-durga-2026',
    voucherNo: 'VCH-004',
    category: 'puja_samagri',
    vendorName: 'श्री राम पूजन भंडार',
    vendorPhone: '9801445566',
    totalAmount: 22000,
    amountPaid: 22000,
    balanceDue: 0,
    paymentMode: 'ONL',
    expenseDate: '2026-09-04',
    paidBy: 'सचिव (अमित कुमार)',
    notes: 'हवन सामग्री, शुध्द देसी घी, चंदन, धूप, रोली आदि पूर्ण भुगतान',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-5',
    eventId: 'evt-durga-2026',
    voucherNo: 'VCH-005',
    category: 'misc',
    vendorName: 'लक्ष्मी प्रिंटर्स & स्टेशनरी',
    vendorPhone: '9934778899',
    totalAmount: 6500,
    amountPaid: 6500,
    balanceDue: 0,
    paymentMode: 'CASH',
    expenseDate: '2026-09-04',
    paidBy: 'सुनील वर्मा',
    notes: 'फ्लेक्स बैनर, पोस्टर एवं आईडी कार्ड छपाई',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_STAFF_LIST: MasterStaff[] = [
  {
    id: 'staff-1',
    name: 'अमित कुमार',
    phone: '9835012345',
    username: 'amit_admin',
    primaryRole: 'admin',
    designation: 'मुख्य प्रशासक एवं महासचिव',
    status: 'active',
    joinedDate: '2024-01-15',
    avatarColor: 'bg-indigo-600',
    workspacePermissions: {
      'ent-election-2026': {
        workspaceId: 'ent-election-2026',
        accessLevel: 'full_control',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.full_control },
      },
      'ent-durga-narayanpur': {
        workspaceId: 'ent-durga-narayanpur',
        accessLevel: 'full_control',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.full_control },
      },
    },
  },
  {
    id: 'staff-2',
    name: 'मनोज कुमार',
    phone: '9835112233',
    username: 'manoj_treasurer',
    primaryRole: 'accountant',
    designation: 'वरिष्ठ कोषाध्यक्ष (वित्तीय नियंत्रक)',
    status: 'active',
    joinedDate: '2024-02-10',
    avatarColor: 'bg-emerald-600',
    workspacePermissions: {
      'ent-durga-narayanpur': {
        workspaceId: 'ent-durga-narayanpur',
        accessLevel: 'full_control',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.full_control },
      },
      'ent-election-2026': {
        workspaceId: 'ent-election-2026',
        accessLevel: 'viewer',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.viewer },
      },
    },
  },
  {
    id: 'staff-3',
    name: 'विक्रम सिंह',
    phone: '9876543230',
    username: 'vikram_warroom',
    primaryRole: 'manager',
    designation: 'चुनाव वॉर रूम एवं बूथ प्रमुख',
    status: 'active',
    joinedDate: '2024-03-01',
    avatarColor: 'bg-rose-600',
    workspacePermissions: {
      'ent-election-2026': {
        workspaceId: 'ent-election-2026',
        accessLevel: 'full_control',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.full_control },
      },
      'ent-durga-narayanpur': {
        workspaceId: 'ent-durga-narayanpur',
        accessLevel: 'editor',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.editor },
      },
    },
  },
  {
    id: 'staff-4',
    name: 'प्रिया कुमारी',
    phone: '9876543231',
    username: 'priya_ward',
    primaryRole: 'karyakarta',
    designation: 'वार्ड समन्वयक एवं महिला मोर्चा',
    status: 'active',
    joinedDate: '2024-04-12',
    avatarColor: 'bg-purple-600',
    workspacePermissions: {
      'ent-election-2026': {
        workspaceId: 'ent-election-2026',
        accessLevel: 'editor',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.editor },
      },
      'ent-durga-narayanpur': {
        workspaceId: 'ent-durga-narayanpur',
        accessLevel: 'viewer',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.viewer },
      },
    },
  },
  {
    id: 'staff-5',
    name: 'सुनील वर्मा',
    phone: '9470123456',
    username: 'sunil_collector',
    password: 'demo123',
    primaryRole: 'collector',
    designation: 'फील्ड संग्रहकर्ता (चंदा संग्रह)',
    status: 'active',
    joinedDate: '2024-05-20',
    avatarColor: 'bg-amber-600',
    workspacePermissions: {
      'ent-durga-narayanpur': {
        workspaceId: 'ent-durga-narayanpur',
        accessLevel: 'collector',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.collector },
      },
    },
  },
  {
    id: 'staff-6',
    name: 'संतोष यादव',
    phone: '9876543232',
    username: 'santosh_youth',
    primaryRole: 'karyakarta',
    designation: 'युवा मोर्चा प्रभारी',
    status: 'active',
    joinedDate: '2024-06-05',
    avatarColor: 'bg-cyan-600',
    workspacePermissions: {
      'ent-election-2026': {
        workspaceId: 'ent-election-2026',
        accessLevel: 'editor',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.editor },
      },
      'ent-durga-narayanpur': {
        workspaceId: 'ent-durga-narayanpur',
        accessLevel: 'viewer',
        modules: { ...DEFAULT_MODULE_ACCESS_MAP.viewer },
      },
    },
  },
];

interface SamitiContextType {
  entities: MasterEntity[];
  currentEntity: MasterEntity;
  setCurrentEntityId: (id: string) => void;
  events: SamitiEvent[];
  currentEvent: SamitiEvent;
  setCurrentEventId: (id: string) => void;
  donations: SamitiDonation[];
  expenses: SamitiExpense[];
  summary: SamitiFinancialSummary;
  mainWorkspaceId: string;
  setMainWorkspaceId: (id: string) => void;
  isMainWorkspace: (id: string) => boolean;
  mainWorkspace: MasterEntity;
  addDonation: (donation: Omit<SamitiDonation, 'id' | 'serialNumber' | 'balanceAmount' | 'createdAt' | 'updatedAt'>) => SamitiDonation;
  updateDonation: (id: string, updates: Partial<SamitiDonation>) => void;
  deleteDonation: (id: string) => void;
  addExpense: (expense: Omit<SamitiExpense, 'id' | 'voucherNo' | 'balanceDue' | 'createdAt'>) => SamitiExpense;
  updateExpense: (id: string, updates: Partial<SamitiExpense>) => void;
  deleteExpense: (id: string) => void;
  importDonations: (newDonations: Array<Omit<SamitiDonation, 'id' | 'createdAt' | 'updatedAt'>>) => number;
  addEntity: (entity: Omit<MasterEntity, 'id'>, initialEvent: Omit<SamitiEvent, 'id' | 'entityId'>) => void;
  updateEntity: (id: string, updates: Partial<MasterEntity>) => void;
  updateEvent: (id: string, updates: Partial<SamitiEvent>) => void;
  deleteEntity: (id: string) => boolean;
  staffList: MasterStaff[];
  addStaff: (staffData: Omit<MasterStaff, 'id' | 'joinedDate'>) => MasterStaff;
  updateStaff: (id: string, updates: Partial<MasterStaff>) => void;
  deleteStaff: (id: string) => void;
  updateStaffPermission: (staffId: string, workspaceId: string, accessLevel: WorkspaceAccessLevel, modules?: Partial<ModuleAccess>) => void;
  grantAllWorkspaces: (staffId: string, accessLevel: WorkspaceAccessLevel) => void;
  resetToSampleData: () => void;
  resetMasterDemoData: () => Promise<void>;
  resetDurgaPujaUnitData: (mode?: 'wipe_clean' | 'restore_defaults') => Promise<void>;
  isCollectorMode: boolean;
  currentStaffMember: MasterStaff | null;
  isCloudConnected: boolean;
  isSyncing: boolean;
  syncWithCloud: () => Promise<void>;
}

const SamitiContext = createContext<SamitiContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ENTITIES: 'victory_samiti_entities_v1',
  EVENTS: 'victory_samiti_events_v1',
  DONATIONS: 'victory_samiti_donations_v1',
  EXPENSES: 'victory_samiti_expenses_v1',
  SELECTED_ENTITY: 'victory_samiti_current_entity_v1',
  SELECTED_EVENT: 'victory_samiti_current_event_v1',
  MAIN_WORKSPACE: 'victory_master_main_workspace_v1',
  STAFF: 'victory_master_staff_v1',
};

export const SamitiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const db = useSamitiDatabase();
  const {
    setIsSyncing,
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
    purgeDemoEntitiesFromCloud,
    resetDurgaPujaDataInCloud,
    subscribeToSamitiRealtime,
  } = db;
  // Load Entities safely
  const [entities, setEntities] = useState<MasterEntity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENTITIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load entities from localStorage:', e);
    }
    return DEFAULT_ENTITIES;
  });

  // Main Workspace (Default is Election Command 2026)
  const [mainWorkspaceId, setMainWorkspaceIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAIN_WORKSPACE);
      if (saved) return saved;
    } catch (e) {
      console.warn('Failed to load mainWorkspaceId from localStorage:', e);
    }
    return 'ent-election-2026';
  });

  const setMainWorkspaceId = (id: string) => {
    setMainWorkspaceIdState(id);
    localStorage.setItem(STORAGE_KEYS.MAIN_WORKSPACE, id);
    const list = Array.isArray(entities) && entities.length > 0 ? entities : DEFAULT_ENTITIES;
    const targetEntity = list.find(e => e?.id === id);
    toast.success(`'${targetEntity?.name || id}' को मुख्य कार्यक्षेत्र (Main Workspace) बनाया गया!`);
  };

  const isMainWorkspace = useCallback((id: string) => {
    return (mainWorkspaceId || 'ent-election-2026') === id;
  }, [mainWorkspaceId]);

  const mainWorkspace = useMemo(() => {
    const list = Array.isArray(entities) && entities.length > 0 ? entities : DEFAULT_ENTITIES;
    return list.find(e => e?.id === mainWorkspaceId) || list[0] || DEFAULT_ENTITIES[0];
  }, [entities, mainWorkspaceId]);

  const [currentEntityId, setCurrentEntityId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_ENTITY);
      if (saved) return saved;
    } catch (e) {
      console.warn('Failed to load currentEntityId from localStorage:', e);
    }
    return DEFAULT_ENTITIES[0].id;
  });

  // Load Events safely
  const [events, setEvents] = useState<SamitiEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load events from localStorage:', e);
    }
    return DEFAULT_EVENTS;
  });

  const currentEntity = useMemo(() => {
    const list = Array.isArray(entities) && entities.length > 0 ? entities : DEFAULT_ENTITIES;
    return list.find(e => e?.id === currentEntityId) || list[0] || DEFAULT_ENTITIES[0];
  }, [entities, currentEntityId]);

  const entityEvents = useMemo(() => {
    const evList = Array.isArray(events) && events.length > 0 ? events : DEFAULT_EVENTS;
    const entId = currentEntity?.id || DEFAULT_ENTITIES[0].id;
    return evList.filter(e => e?.entityId === entId);
  }, [events, currentEntity]);

  const [currentEventId, setCurrentEventId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_EVENT);
      if (saved) return saved;
    } catch (e) {
      console.warn('Failed to load currentEventId from localStorage:', e);
    }
    return DEFAULT_EVENTS[0].id;
  });

  const currentEvent = useMemo(() => {
    const evList = Array.isArray(entityEvents) && entityEvents.length > 0 ? entityEvents : DEFAULT_EVENTS;
    return (
      evList.find(e => e?.id === currentEventId) ||
      evList[0] ||
      DEFAULT_EVENTS[0]
    );
  }, [entityEvents, currentEventId]);

  // Load Donations safely
  const [donations, setDonations] = useState<SamitiDonation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DONATIONS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load donations from localStorage:', e);
    }
    return [];
  });

  // Load Expenses safely
  const [expenses, setExpenses] = useState<SamitiExpense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load expenses from localStorage:', e);
    }
    return [];
  });

  // Load Staff safely
  const [staffList, setStaffList] = useState<MasterStaff[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load staffList from localStorage:', e);
    }
    return DEFAULT_STAFF_LIST;
  });

  // Identify logged-in staff member
  const currentStaffMember = useMemo(() => {
    const cleanUser = (auth?.profile?.username || '').toLowerCase().trim();
    if (!cleanUser) return null;
    return staffList.find(s => s?.username?.toLowerCase() === cleanUser) || null;
  }, [auth?.profile?.username, staffList]);

  // Is current logged in user restricted to collector mode?
  const isCollectorMode = useMemo(() => {
    if (auth?.isCollector) return true;
    if (currentStaffMember) {
      if (currentStaffMember.primaryRole === 'collector') return true;
      const perm = currentStaffMember.workspacePermissions?.[currentEntityId];
      if (perm?.accessLevel === 'collector') return true;
    }
    return false;
  }, [auth?.isCollector, currentStaffMember, currentEntityId]);

  // Auto-lock current entity for assigned collector
  useEffect(() => {
    if (auth?.assignedWorkspaceId && currentEntityId !== auth.assignedWorkspaceId) {
      setCurrentEntityId(auth.assignedWorkspaceId);
    }
  }, [auth?.assignedWorkspaceId, currentEntityId]);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(entities));
    } catch (e) {
      console.warn(e);
    }
  }, [entities]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (e) {
      console.warn(e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
    } catch (e) {
      console.warn(e);
    }
  }, [donations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.warn(e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ENTITY, currentEntityId);
    } catch (e) {
      console.warn(e);
    }
  }, [currentEntityId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_EVENT, currentEventId);
    } catch (e) {
      console.warn(e);
    }
  }, [currentEventId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
    } catch (e) {
      console.warn(e);
    }
  }, [staffList]);

  // Cloud Synchronization
  const syncWithCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [cloudEntities, cloudEvents, cloudDonations, cloudExpenses, cloudStaff] = await Promise.all([
        fetchEntitiesFromCloud(),
        fetchEventsFromCloud(),
        fetchDonationsFromCloud(),
        fetchExpensesFromCloud(),
        fetchStaffFromCloud(),
      ]);

      if (cloudEntities && cloudEntities.length > 0) {
        setEntities(cloudEntities);
      } else if (cloudEntities && cloudEntities.length === 0) {
        // First run on new database - auto-seed initial entities & staff to cloud
        for (const ent of DEFAULT_ENTITIES) {
          await saveEntityToCloud(ent);
        }
        for (const evt of DEFAULT_EVENTS) {
          await saveEventToCloud(evt);
        }
        for (const st of DEFAULT_STAFF_LIST) {
          await saveStaffToCloud(st);
        }
      }

      if (cloudEvents && cloudEvents.length > 0) {
        setEvents(cloudEvents);
      }
      if (cloudDonations !== null) {
        setDonations(cloudDonations);
      }
      if (cloudExpenses !== null) {
        setExpenses(cloudExpenses);
      }
      if (cloudStaff && cloudStaff.length > 0) {
        setStaffList(cloudStaff);
      }
    } catch (e) {
      console.warn('Sync with cloud failed:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [
    setIsSyncing,
    fetchEntitiesFromCloud,
    saveEntityToCloud,
    fetchEventsFromCloud,
    saveEventToCloud,
    fetchDonationsFromCloud,
    saveDonationToCloud,
    fetchExpensesFromCloud,
    saveExpenseToCloud,
    fetchStaffFromCloud,
    saveStaffToCloud,
  ]);

  // Keep a stable ref to syncWithCloud so the initial mount sync runs without adding syncWithCloud to deps
  const syncWithCloudRef = useRef(syncWithCloud);
  syncWithCloudRef.current = syncWithCloud;

  useEffect(() => {
    // Initial sync with cloud on mount
    syncWithCloudRef.current();

    const unsubscribe = subscribeToSamitiRealtime((payload) => {
      const { table, eventType, newRow, oldRow } = payload;
      if (table === 'samiti_donations') {
        if (eventType === 'INSERT' && newRow) {
          setDonations(prev => {
            if (prev.some(d => d.id === newRow.id)) return prev;
            return [...prev, {
              id: newRow.id,
              eventId: newRow.event_id,
              serialNumber: newRow.serial_number,
              category: newRow.category,
              name: newRow.name,
              identity: newRow.identity || '',
              caste: newRow.caste || '',
              address1: newRow.address1 || '',
              address2: newRow.address2 || '',
              phone: newRow.phone || '',
              acceptedAmount: Number(newRow.accepted_amount) || 0,
              receivedAmount: Number(newRow.received_amount) || 0,
              balanceAmount: Number(newRow.balance_amount) || 0,
              paymentMode: newRow.payment_mode,
              collectorName: newRow.collector_name || undefined,
              isHandoverDone: newRow.is_handover_done ?? false,
              date: newRow.date,
              remarks: newRow.remarks || undefined,
              receiptUrl: newRow.receipt_url || undefined,
              createdAt: newRow.created_at || new Date().toISOString(),
              updatedAt: newRow.updated_at || new Date().toISOString(),
            }];
          });
        } else if (eventType === 'UPDATE' && newRow) {
          setDonations(prev => prev.map(d => d.id === newRow.id ? {
            ...d,
            eventId: newRow.event_id,
            serialNumber: newRow.serial_number,
            category: newRow.category,
            name: newRow.name,
            identity: newRow.identity || '',
            caste: newRow.caste || '',
            address1: newRow.address1 || '',
            address2: newRow.address2 || '',
            phone: newRow.phone || '',
            acceptedAmount: Number(newRow.accepted_amount) || 0,
            receivedAmount: Number(newRow.received_amount) || 0,
            balanceAmount: Number(newRow.balance_amount) || 0,
            paymentMode: newRow.payment_mode,
            collectorName: newRow.collector_name || undefined,
            isHandoverDone: newRow.is_handover_done ?? false,
            date: newRow.date,
            remarks: newRow.remarks || undefined,
            receiptUrl: newRow.receipt_url || undefined,
            updatedAt: newRow.updated_at || new Date().toISOString(),
          } : d));
        } else if (eventType === 'DELETE' && oldRow) {
          setDonations(prev => prev.filter(d => d.id !== oldRow.id));
        }
      } else if (table === 'samiti_expenses') {
        if (eventType === 'INSERT' && newRow) {
          setExpenses(prev => {
            if (prev.some(e => e.id === newRow.id)) return prev;
            return [...prev, {
              id: newRow.id,
              eventId: newRow.event_id,
              voucherNo: newRow.voucher_no,
              category: newRow.category,
              vendorName: newRow.vendor_name,
              vendorPhone: newRow.vendor_phone || undefined,
              totalAmount: Number(newRow.total_amount) || 0,
              amountPaid: Number(newRow.amount_paid) || 0,
              balanceDue: Number(newRow.balance_due) || 0,
              paymentMode: newRow.payment_mode,
              expenseDate: newRow.expense_date,
              paidBy: newRow.paid_by || undefined,
              billReceiptUrl: newRow.bill_receipt_url || undefined,
              notes: newRow.notes || undefined,
              createdAt: newRow.created_at || new Date().toISOString(),
            }];
          });
        } else if (eventType === 'UPDATE' && newRow) {
          setExpenses(prev => prev.map(e => e.id === newRow.id ? {
            ...e,
            eventId: newRow.event_id,
            voucherNo: newRow.voucher_no,
            category: newRow.category,
            vendorName: newRow.vendor_name,
            vendorPhone: newRow.vendor_phone || undefined,
            totalAmount: Number(newRow.total_amount) || 0,
            amountPaid: Number(newRow.amount_paid) || 0,
            balanceDue: Number(newRow.balance_due) || 0,
            paymentMode: newRow.payment_mode,
            expenseDate: newRow.expense_date,
            paidBy: newRow.paid_by || undefined,
            billReceiptUrl: newRow.bill_receipt_url || undefined,
            notes: newRow.notes || undefined,
          } : e));
        } else if (eventType === 'DELETE' && oldRow) {
          setExpenses(prev => prev.filter(e => e.id !== oldRow.id));
        }
      } else if (table === 'samiti_entities') {
        if (eventType === 'INSERT' && newRow) {
          setEntities(prev => {
            if (prev.some(e => e.id === newRow.id)) return prev;
            return [...prev, {
              id: newRow.id,
              name: newRow.name,
              type: newRow.type as any,
              upiId: newRow.upi_id || undefined,
              tagline: newRow.tagline || undefined,
              location: newRow.location || undefined,
              establishedYear: newRow.established_year || undefined,
            }];
          });
        } else if (eventType === 'UPDATE' && newRow) {
          setEntities(prev => prev.map(e => e.id === newRow.id ? {
            ...e,
            name: newRow.name,
            type: newRow.type as any,
            upiId: newRow.upi_id || undefined,
            tagline: newRow.tagline || undefined,
            location: newRow.location || undefined,
            establishedYear: newRow.established_year || undefined,
          } : e));
        } else if (eventType === 'DELETE' && oldRow) {
          setEntities(prev => prev.filter(e => e.id !== oldRow.id));
        }
      } else if (table === 'samiti_events') {
        if (eventType === 'INSERT' && newRow) {
          setEvents(prev => {
            if (prev.some(e => e.id === newRow.id)) return prev;
            return [...prev, {
              id: newRow.id,
              entityId: newRow.entity_id,
              title: newRow.title,
              fiscalYear: newRow.fiscal_year,
              targetBudget: Number(newRow.target_budget) || 0,
              startDate: newRow.start_date || undefined,
              endDate: newRow.end_date || undefined,
              isActive: newRow.is_active ?? true,
            }];
          });
        } else if (eventType === 'UPDATE' && newRow) {
          setEvents(prev => prev.map(e => e.id === newRow.id ? {
            ...e,
            entityId: newRow.entity_id,
            title: newRow.title,
            fiscalYear: newRow.fiscal_year,
            targetBudget: Number(newRow.target_budget) || 0,
            startDate: newRow.start_date || undefined,
            endDate: newRow.end_date || undefined,
            isActive: newRow.is_active ?? true,
          } : e));
        } else if (eventType === 'DELETE' && oldRow) {
          setEvents(prev => prev.filter(e => e.id !== oldRow.id));
        }
      } else if (table === 'master_staff') {
        if (eventType === 'INSERT' && newRow) {
          setStaffList(prev => {
            if (prev.some(s => s.id === newRow.id)) return prev;
            return [...prev, {
              id: newRow.id,
              name: newRow.name,
              phone: newRow.phone,
              email: newRow.email || undefined,
              username: newRow.username,
              password: newRow.password_hash || undefined,
              primaryRole: newRow.primary_role as any,
              designation: newRow.designation || '',
              status: newRow.status as any,
              joinedDate: newRow.joined_date,
              avatarColor: newRow.avatar_color || undefined,
              workspacePermissions: (newRow.workspace_permissions as any) || {},
            }];
          });
        } else if (eventType === 'UPDATE' && newRow) {
          setStaffList(prev => prev.map(s => s.id === newRow.id ? {
            ...s,
            name: newRow.name,
            phone: newRow.phone,
            email: newRow.email || undefined,
            username: newRow.username,
            password: newRow.password_hash || undefined,
            primaryRole: newRow.primary_role as any,
            designation: newRow.designation || '',
            status: newRow.status as any,
            joinedDate: newRow.joined_date,
            avatarColor: newRow.avatar_color || undefined,
            workspacePermissions: (newRow.workspace_permissions as any) || {},
          } : s));
        } else if (eventType === 'DELETE' && oldRow) {
          setStaffList(prev => prev.filter(s => s.id !== oldRow.id));
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToSamitiRealtime]);

  // Donations filtered for the active event safely
  const currentDonations = useMemo(() => {
    const donList = Array.isArray(donations) ? donations : SEED_DONATIONS;
    const evtId = currentEvent?.id || DEFAULT_EVENTS[0].id;
    return donList
      .filter(d => d && d.eventId === evtId)
      .sort((a, b) => (a?.serialNumber || 0) - (b?.serialNumber || 0));
  }, [donations, currentEvent]);

  // Expenses filtered for the active event safely
  const currentExpenses = useMemo(() => {
    const expList = Array.isArray(expenses) ? expenses : SEED_EXPENSES;
    const evtId = currentEvent?.id || DEFAULT_EVENTS[0].id;
    return expList.filter(e => e && e.eventId === evtId);
  }, [expenses, currentEvent]);

  // Calculate financial summary
  const summary: SamitiFinancialSummary = useMemo(() => {
    let totalAccepted = 0;
    let totalReceived = 0;
    let totalBalance = 0;
    let cashReceived = 0;
    let onlineReceived = 0;
    let fullyPaidDonors = 0;
    let partialDonors = 0;
    let pendingDonors = 0;

    currentDonations.forEach(d => {
      totalAccepted += d.acceptedAmount || 0;
      totalReceived += d.receivedAmount || 0;
      totalBalance += d.balanceAmount || 0;

      if (d.paymentMode === 'CASH') {
        cashReceived += d.receivedAmount || 0;
      } else if (d.paymentMode === 'ONL') {
        onlineReceived += d.receivedAmount || 0;
      } else {
        // Mixed: 50% split if not detailed
        cashReceived += (d.receivedAmount || 0) / 2;
        onlineReceived += (d.receivedAmount || 0) / 2;
      }

      if (d.balanceAmount === 0 && d.receivedAmount > 0) {
        fullyPaidDonors++;
      } else if (d.balanceAmount > 0 && d.receivedAmount > 0) {
        partialDonors++;
      } else {
        pendingDonors++;
      }
    });

    let totalExpenses = 0;
    let expensesPaid = 0;
    let expenseBalanceDue = 0;

    currentExpenses.forEach(e => {
      totalExpenses += e.totalAmount || 0;
      expensesPaid += e.amountPaid || 0;
      expenseBalanceDue += e.balanceDue || 0;
    });

    const netSurplus = totalReceived - expensesPaid;

    return {
      totalAccepted,
      totalReceived,
      totalBalance,
      cashReceived,
      onlineReceived,
      totalExpenses,
      expensesPaid,
      expenseBalanceDue,
      netSurplus,
      totalDonors: currentDonations.length,
      fullyPaidDonors,
      partialDonors,
      pendingDonors,
    };
  }, [currentDonations, currentExpenses]);

  // Add donation
  const addDonation = useCallback(
    (donationData: Omit<SamitiDonation, 'id' | 'serialNumber' | 'balanceAmount' | 'createdAt' | 'updatedAt'>) => {
      // Find highest serial number in the current event
      const maxSerial = currentDonations.reduce((max, d) => Math.max(max, d.serialNumber || 0), 0);
      const serialNumber = maxSerial + 1;
      const balanceAmount = Math.max(0, donationData.acceptedAmount - donationData.receivedAmount);

      const newDonation: SamitiDonation = {
        ...donationData,
        id: `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        serialNumber,
        balanceAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDonations(prev => [...prev, newDonation]);
      saveDonationToCloud(newDonation);
      toast.success(`दान प्रविष्टि क्रमांक #${serialNumber} सफलतापूर्वक दर्ज की गई!`);
      return newDonation;
    },
    [currentDonations, saveDonationToCloud]
  );

  // Update donation
  const updateDonation = useCallback((id: string, updates: Partial<SamitiDonation>) => {
    let updatedItem: SamitiDonation | null = null;
    setDonations(prev =>
      prev.map(item => {
        if (item.id === id) {
          const accepted = updates.acceptedAmount !== undefined ? updates.acceptedAmount : item.acceptedAmount;
          const received = updates.receivedAmount !== undefined ? updates.receivedAmount : item.receivedAmount;
          const balanceAmount = Math.max(0, accepted - received);

          updatedItem = {
            ...item,
            ...updates,
            balanceAmount,
            updatedAt: new Date().toISOString(),
          };
          return updatedItem;
        }
        return item;
      })
    );
    if (updatedItem) {
      saveDonationToCloud(updatedItem);
    }
    toast.success('दान प्रविष्टि सफलतापूर्वक अपडेट की गई!');
  }, [saveDonationToCloud]);

  // Delete donation
  const deleteDonation = useCallback(
    (id: string) => {
      if (isCollectorMode) {
        toast.error('संग्रहकर्ता को चंदा प्रविष्टि हटाने की अनुमति नहीं है।');
        return;
      }
      setDonations(prev => prev.filter(item => item.id !== id));
      deleteDonationFromCloud(id);
      toast.info('दान प्रविष्टि हटा दी गई!');
    },
    [isCollectorMode, deleteDonationFromCloud]
  );

  // Add expense
  const addExpense = useCallback(
    (expenseData: Omit<SamitiExpense, 'id' | 'voucherNo' | 'balanceDue' | 'createdAt'>) => {
      const voucherNo = `VCH-${String(currentExpenses.length + 1).padStart(3, '0')}`;
      const balanceDue = Math.max(0, expenseData.totalAmount - expenseData.amountPaid);

      const newExpense: SamitiExpense = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        voucherNo,
        balanceDue,
        createdAt: new Date().toISOString(),
      };

      setExpenses(prev => [...prev, newExpense]);
      saveExpenseToCloud(newExpense);
      toast.success(`खर्चा वाउचर #${voucherNo} सफलतापूर्वक दर्ज हुआ!`);
      return newExpense;
    },
    [currentExpenses.length, saveExpenseToCloud]
  );

  // Update expense
  const updateExpense = useCallback((id: string, updates: Partial<SamitiExpense>) => {
    let updatedExp: SamitiExpense | null = null;
    setExpenses(prev =>
      prev.map(item => {
        if (item.id === id) {
          const total = updates.totalAmount !== undefined ? updates.totalAmount : item.totalAmount;
          const paid = updates.amountPaid !== undefined ? updates.amountPaid : item.amountPaid;
          const balanceDue = Math.max(0, total - paid);

          updatedExp = {
            ...item,
            ...updates,
            balanceDue,
          };
          return updatedExp;
        }
        return item;
      })
    );
    if (updatedExp) {
      saveExpenseToCloud(updatedExp);
    }
    toast.success('खर्चा वाउचर अपडेट किया गया!');
  }, [saveExpenseToCloud]);

  // Delete expense
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
    deleteExpenseFromCloud(id);
    toast.info('खर्चा वाउचर हटा दिया गया!');
  }, [deleteExpenseFromCloud]);

  // Import donations from CSV/Excel
  const importDonations = useCallback(
    (newDonationsData: Array<Omit<SamitiDonation, 'id' | 'createdAt' | 'updatedAt'>>) => {
      let currentMax = currentDonations.reduce((max, d) => Math.max(max, d.serialNumber || 0), 0);

      const toInsert: SamitiDonation[] = newDonationsData.map(d => {
        currentMax++;
        return {
          ...d,
          id: `don-imp-${Date.now()}-${currentMax}`,
          serialNumber: d.serialNumber || currentMax,
          balanceAmount: Math.max(0, (d.acceptedAmount || 0) - (d.receivedAmount || 0)),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      setDonations(prev => [...prev, ...toInsert]);
      bulkSaveDonationsToCloud(toInsert);
      toast.success(`${toInsert.length} दान प्रविष्टियाँ सफलतापूर्वक इम्पोर्ट की गईं!`);
      return toInsert.length;
    },
    [currentDonations, bulkSaveDonationsToCloud]
  );

  // Add entity
  const addEntity = useCallback(
    (entityData: Omit<MasterEntity, 'id'>, initialEventData: Omit<SamitiEvent, 'id' | 'entityId'>) => {
      const newEntityId = `ent-${Date.now()}`;
      const newEntity: MasterEntity = {
        ...entityData,
        id: newEntityId,
      };

      const newEventId = `evt-${Date.now()}`;
      const newEvent: SamitiEvent = {
        ...initialEventData,
        id: newEventId,
        entityId: newEntityId,
      };

      setEntities(prev => [...prev, newEntity]);
      setEvents(prev => [...prev, newEvent]);
      saveEntityToCloud(newEntity);
      saveEventToCloud(newEvent);
      setCurrentEntityId(newEntityId);
      setCurrentEventId(newEventId);
      toast.success(`नया संगठन/समिति "${newEntity.name}" तैयार हो गया!`);
    },
    [saveEntityToCloud, saveEventToCloud]
  );

  // Update entity
  const updateEntity = useCallback((id: string, updates: Partial<MasterEntity>) => {
    let updated: MasterEntity | null = null;
    setEntities(prev => prev.map(e => {
      if (e.id === id) {
        updated = { ...e, ...updates };
        return updated;
      }
      return e;
    }));
    if (updated) {
      saveEntityToCloud(updated);
    }
    toast.success('कार्यक्षेत्र जानकारी सफलतापूर्वक अपडेट की गई!');
  }, [saveEntityToCloud]);

  // Update event
  const updateEvent = useCallback((id: string, updates: Partial<SamitiEvent>) => {
    let updated: SamitiEvent | null = null;
    setEvents(prev => prev.map(ev => {
      if (ev.id === id) {
        updated = { ...ev, ...updates };
        return updated;
      }
      return ev;
    }));
    if (updated) {
      saveEventToCloud(updated);
    }
    toast.success('महोत्सव व कार्यक्रम विवरण सफलतापूर्वक अपडेट किया गया!');
  }, [saveEventToCloud]);

  // Delete entity
  const deleteEntity = useCallback(
    (entityId: string) => {
      if (entityId === mainWorkspaceId) {
        toast.error('मुख्य कार्यक्षेत्र (Main Workspace) को सीधे नहीं हटाया जा सकता। कृपया पहले किसी अन्य कार्यक्षेत्र को मुख्य बनाएं।');
        return false;
      }

      if (entities.length <= 1) {
        toast.error('कम से कम एक कार्यक्षेत्र रहना अनिवार्य है।');
        return false;
      }

      const targetEntity = entities.find(e => e.id === entityId);
      const remainingEntities = entities.filter(e => e.id !== entityId);
      const remainingEvents = events.filter(e => e.entityId !== entityId);
      const deletedEventIds = events.filter(e => e.entityId === entityId).map(e => e.id);
      const remainingDonations = donations.filter(d => !deletedEventIds.includes(d.eventId));
      const remainingExpenses = expenses.filter(exp => !deletedEventIds.includes(exp.eventId));

      setEntities(remainingEntities);
      setEvents(remainingEvents);
      setDonations(remainingDonations);
      setExpenses(remainingExpenses);
      deleteEntityFromCloud(entityId);

      if (currentEntityId === entityId) {
        setCurrentEntityId(remainingEntities[0].id);
        const newEvent = remainingEvents.find(e => e.entityId === remainingEntities[0].id);
        if (newEvent) setCurrentEventId(newEvent.id);
      }

      // Clean up staff permissions for this workspace
      setStaffList(prev =>
        prev.map(staff => {
          if (!staff.workspacePermissions[entityId]) return staff;
          const { [entityId]: removed, ...restPermissions } = staff.workspacePermissions;
          const updatedStaff = {
            ...staff,
            workspacePermissions: restPermissions,
          };
          saveStaffToCloud(updatedStaff);
          return updatedStaff;
        })
      );

      toast.success(`कार्यक्षेत्र "${targetEntity?.name || entityId}" और उसका समस्त डेटा हटा दिया गया!`);
      return true;
    },
    [mainWorkspaceId, entities, events, donations, expenses, currentEntityId, deleteEntityFromCloud, saveStaffToCloud]
  );

  // Add staff
  const addStaff = useCallback((staffData: Omit<MasterStaff, 'id' | 'joinedDate'>) => {
    const newStaff: MasterStaff = {
      ...staffData,
      id: `staff-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
      avatarColor: staffData.avatarColor || 'bg-slate-700',
    };

    setStaffList(prev => [...prev, newStaff]);
    saveStaffToCloud(newStaff);
    toast.success(`कार्यकर्ता/स्टाफ "${newStaff.name}" सफलतापूर्वक जोड़ा गया!`);
    return newStaff;
  }, [saveStaffToCloud]);

  // Update staff
  const updateStaff = useCallback((id: string, updates: Partial<MasterStaff>) => {
    let updated: MasterStaff | null = null;
    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        updated = { ...s, ...updates };
        return updated;
      }
      return s;
    }));
    if (updated) {
      saveStaffToCloud(updated);
    }
    toast.success('कार्यकर्ता विवरण अपडेट किया गया!');
  }, [saveStaffToCloud]);

  // Delete staff
  const deleteStaff = useCallback((id: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
    deleteStaffFromCloud(id);
    toast.info('कार्यकर्ता को सिस्टम से हटा दिया गया!');
  }, [deleteStaffFromCloud]);

  // Update staff permission for specific workspace
  const updateStaffPermission = useCallback(
    (
      staffId: string,
      workspaceId: string,
      accessLevel: WorkspaceAccessLevel,
      modules?: Partial<ModuleAccess>
    ) => {
      setStaffList(prev =>
        prev.map(staff => {
          if (staff.id !== staffId) return staff;
          const currentPerm = staff.workspacePermissions[workspaceId];
          const defaultModules = DEFAULT_MODULE_ACCESS_MAP[accessLevel];

          const updatedModules: ModuleAccess = {
            ...(currentPerm ? currentPerm.modules : defaultModules),
            ...(modules || {}),
          };

          const updatedStaff = {
            ...staff,
            workspacePermissions: {
              ...staff.workspacePermissions,
              [workspaceId]: {
                workspaceId,
                accessLevel,
                modules: updatedModules,
              },
            },
          };
          saveStaffToCloud(updatedStaff);
          return updatedStaff;
        })
      );
      toast.success('कार्यक्षेत्र अनुमति व पहुंच अधिकार अपडेट किए गए!');
    },
    [saveStaffToCloud]
  );

  // Grant all workspaces
  const grantAllWorkspaces = useCallback(
    (staffId: string, accessLevel: WorkspaceAccessLevel) => {
      setStaffList(prev =>
        prev.map(staff => {
          if (staff.id !== staffId) return staff;
          const newPerms: Record<string, WorkspacePermission> = {};
          entities.forEach(ent => {
            newPerms[ent.id] = {
              workspaceId: ent.id,
              accessLevel,
              modules: { ...DEFAULT_MODULE_ACCESS_MAP[accessLevel] },
            };
          });
          const updatedStaff = {
            ...staff,
            workspacePermissions: newPerms,
          };
          saveStaffToCloud(updatedStaff);
          return updatedStaff;
        })
      );
      toast.success(`सभी ${entities.length} कार्यक्षेत्रों में पहुंच अधिकार प्रदान किए गए!`);
    },
    [entities, saveStaffToCloud]
  );

  // Reset master demo data (Purge all except Durga Puja Unit and Election Command)
  const resetMasterDemoData = useCallback(async () => {
    try {
      setIsSyncing(true);
      toast.loading('मास्टर डेमो डेटा रीसेट एवं क्लाउड पर्ज जारी है...', { id: 'purge-toast' });
      
      // 1. Purge from live Supabase database
      await purgeDemoEntitiesFromCloud(['ent-durga-narayanpur', 'ent-election-2026']);
      
      // 2. Reset in-memory state to clean defaults (only Durga Puja & Election Command)
      setEntities(DEFAULT_ENTITIES);
      setEvents(DEFAULT_EVENTS);
      setDonations(SEED_DONATIONS);
      setExpenses(SEED_EXPENSES);
      setStaffList(DEFAULT_STAFF_LIST);
      
      // 3. Reset active pointers
      setCurrentEntityId('ent-durga-narayanpur');
      setCurrentEventId('evt-durga-2026');
      setMainWorkspaceIdState('ent-election-2026');
      
      // 4. Update localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(DEFAULT_ENTITIES));
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_EVENTS));
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(DEFAULT_STAFF_LIST));
        localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(SEED_DONATIONS));
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
        localStorage.setItem(STORAGE_KEYS.SELECTED_ENTITY, 'ent-durga-narayanpur');
        localStorage.setItem(STORAGE_KEYS.SELECTED_EVENT, 'evt-durga-2026');
        localStorage.setItem(STORAGE_KEYS.MAIN_WORKSPACE, 'ent-election-2026');
      } catch (e) {
        console.warn('LocalStorage save error on reset:', e);
      }
      
      toast.success('समस्त डेमो डेटा हटा दिया गया! केवल दुर्गा पूजा यूनिट और इलेक्शन कमांड सुरक्षित रखे गए हैं।', { id: 'purge-toast' });
    } catch (err: any) {
      console.error('Reset master demo data error:', err);
      toast.error('डेटा रीसेट में त्रुटि आई: ' + err.message, { id: 'purge-toast' });
    } finally {
      setIsSyncing(false);
    }
  }, [setIsSyncing, purgeDemoEntitiesFromCloud]);

  // Reset to sample data
  const resetToSampleData = useCallback(() => {
    resetMasterDemoData();
  }, [resetMasterDemoData]);

  // Reset Durga Puja Unit demo data
  const resetDurgaPujaUnitData = useCallback(
    async (mode: 'wipe_clean' | 'restore_defaults' = 'wipe_clean') => {
      try {
        setIsSyncing(true);
        toast.loading(
          mode === 'wipe_clean'
            ? 'दुर्गा पूजा यूनिट का डेटा साफ किया जा रहा है...'
            : 'डिफ़ॉल्ट डेमो डेटा रीस्टोर किया जा रहा है...',
          { id: 'dp-reset-toast' }
        );

        const targetEventId = 'evt-durga-2026';

        if (mode === 'wipe_clean') {
          await resetDurgaPujaDataInCloud(targetEventId);
          setDonations(prev => {
            const filtered = prev.filter(d => d.eventId !== targetEventId);
            try {
              localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(filtered));
            } catch (e) {
              console.warn(e);
            }
            return filtered;
          });
          setExpenses(prev => {
            const filtered = prev.filter(e => e.eventId !== targetEventId);
            try {
              localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
            } catch (e) {
              console.warn(e);
            }
            return filtered;
          });
          toast.success('दुर्गा पूजा यूनिट के सभी डेमो चंदा व खर्चा रिकॉर्ड हटा दिए गए! संदूक शून्य है।', { id: 'dp-reset-toast' });
        } else {
          await resetDurgaPujaDataInCloud(targetEventId, {
            donations: SEED_DONATIONS,
            expenses: SEED_EXPENSES,
          });
          setDonations(prev => {
            const other = prev.filter(d => d.eventId !== targetEventId);
            const next = [...other, ...SEED_DONATIONS];
            try {
              localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(next));
            } catch (e) {
              console.warn(e);
            }
            return next;
          });
          setExpenses(prev => {
            const other = prev.filter(e => e.eventId !== targetEventId);
            const next = [...other, ...SEED_EXPENSES];
            try {
              localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(next));
            } catch (e) {
              console.warn(e);
            }
            return next;
          });
          toast.success('दुर्गा पूजा यूनिट का डिफ़ॉल्ट डेमो डेटा सफलतापूर्वक रीस्टोर कर दिया गया!', { id: 'dp-reset-toast' });
        }
      } catch (err: any) {
        console.error('Reset Durga Puja data error:', err);
        toast.error('डेटा रीसेट में त्रुटि आई: ' + err.message, { id: 'dp-reset-toast' });
      } finally {
        setIsSyncing(false);
      }
    },
    [setIsSyncing, resetDurgaPujaDataInCloud]
  );

  return (
    <SamitiContext.Provider
      value={{
        entities,
        currentEntity,
        setCurrentEntityId,
        events: entityEvents,
        currentEvent,
        setCurrentEventId,
        donations: currentDonations,
        expenses: currentExpenses,
        summary,
        mainWorkspaceId,
        setMainWorkspaceId,
        isMainWorkspace,
        mainWorkspace,
        addDonation,
        updateDonation,
        deleteDonation,
        addExpense,
        updateExpense,
        deleteExpense,
        importDonations,
        addEntity,
        updateEntity,
        updateEvent,
        deleteEntity,
        staffList,
        addStaff,
        updateStaff,
        deleteStaff,
        updateStaffPermission,
        grantAllWorkspaces,
        resetToSampleData,
        resetMasterDemoData,
        resetDurgaPujaUnitData,
        isCollectorMode,
        currentStaffMember,
        isCloudConnected: db.isCloudConnected,
        isSyncing: db.isSyncing,
        syncWithCloud,
      }}
    >
      {children}
    </SamitiContext.Provider>
  );
};

export const useSamiti = (): SamitiContextType => {
  const context = useContext(SamitiContext);
  if (!context) {
    throw new Error('useSamiti must be used within a SamitiProvider');
  }
  return context;
};
