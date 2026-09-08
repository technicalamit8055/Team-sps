import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import { toast } from 'sonner';

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
    id: 'ent-ganesh-utsav',
    name: 'श्री गणेश उत्सव मंडल, नारायणपुर',
    type: 'festival_samiti',
    upiId: 'ganeshutsav@upi',
    tagline: 'गणपति बप्पा मोरया! रिद्धि-सिद्धि के दाता की जय।',
    location: 'स्टेशन रोड, नारायणपुर',
    establishedYear: 2002,
  },
  {
    id: 'ent-vyapar-mandal',
    name: 'नारायणपुर व्यापार मंडल वार्षिक महोत्सव',
    type: 'business',
    upiId: 'vyapar.narayanpur@upi',
    tagline: 'व्यापार वृद्धि एवं सामाजिक सहयोग महाकुंभ',
    location: 'कमर्शियल कॉम्प्लेक्स, नारायणपुर',
    establishedYear: 2015,
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
  {
    id: 'evt-ganesh-2026',
    entityId: 'ent-ganesh-utsav',
    title: 'श्री गणेश चतुर्थी महोत्सव 2026',
    fiscalYear: '2026-27',
    targetBudget: 250000,
    startDate: '2026-09-15',
    endDate: '2026-09-25',
    isActive: true,
  },
  {
    id: 'evt-trade-2026',
    entityId: 'ent-vyapar-mandal',
    title: 'दीपावली व्यापार मेला एवं सांस्कृतिक प्रदर्शनी 2026',
    fiscalYear: '2026-27',
    targetBudget: 400000,
    startDate: '2026-10-28',
    endDate: '2026-11-02',
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
  addDonation: (donation: Omit<SamitiDonation, 'id' | 'serialNumber' | 'balanceAmount' | 'createdAt' | 'updatedAt'>) => SamitiDonation;
  updateDonation: (id: string, updates: Partial<SamitiDonation>) => void;
  deleteDonation: (id: string) => void;
  addExpense: (expense: Omit<SamitiExpense, 'id' | 'voucherNo' | 'balanceDue' | 'createdAt'>) => SamitiExpense;
  updateExpense: (id: string, updates: Partial<SamitiExpense>) => void;
  deleteExpense: (id: string) => void;
  importDonations: (newDonations: Array<Omit<SamitiDonation, 'id' | 'createdAt' | 'updatedAt'>>) => number;
  addEntity: (entity: Omit<MasterEntity, 'id'>, initialEvent: Omit<SamitiEvent, 'id' | 'entityId'>) => void;
  resetToSampleData: () => void;
}

const SamitiContext = createContext<SamitiContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ENTITIES: 'victory_samiti_entities_v1',
  EVENTS: 'victory_samiti_events_v1',
  DONATIONS: 'victory_samiti_donations_v1',
  EXPENSES: 'victory_samiti_expenses_v1',
  SELECTED_ENTITY: 'victory_samiti_current_entity_v1',
  SELECTED_EVENT: 'victory_samiti_current_event_v1',
};

export const SamitiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load Entities
  const [entities, setEntities] = useState<MasterEntity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ENTITIES);
    return saved ? JSON.parse(saved) : DEFAULT_ENTITIES;
  });

  const [currentEntityId, setCurrentEntityId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_ENTITY);
    return saved && entities.some(e => e.id === saved) ? saved : entities[0]?.id || DEFAULT_ENTITIES[0].id;
  });

  // Load Events
  const [events, setEvents] = useState<SamitiEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
  });

  const currentEntity = useMemo(() => {
    return entities.find(e => e.id === currentEntityId) || entities[0];
  }, [entities, currentEntityId]);

  const entityEvents = useMemo(() => {
    return events.filter(e => e.entityId === currentEntity.id);
  }, [events, currentEntity.id]);

  const [currentEventId, setCurrentEventId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_EVENT);
    return saved || DEFAULT_EVENTS[0].id;
  });

  const currentEvent = useMemo(() => {
    return (
      entityEvents.find(e => e.id === currentEventId) ||
      entityEvents[0] ||
      events[0] ||
      DEFAULT_EVENTS[0]
    );
  }, [entityEvents, currentEventId, events]);

  // Load Donations
  const [donations, setDonations] = useState<SamitiDonation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DONATIONS);
    return saved ? JSON.parse(saved) : SEED_DONATIONS;
  });

  // Load Expenses
  const [expenses, setExpenses] = useState<SamitiExpense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : SEED_EXPENSES;
  });

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(entities));
  }, [entities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_ENTITY, currentEntityId);
  }, [currentEntityId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_EVENT, currentEventId);
  }, [currentEventId]);

  // Donations filtered for the active event
  const currentDonations = useMemo(() => {
    return donations
      .filter(d => d.eventId === currentEvent.id)
      .sort((a, b) => a.serialNumber - b.serialNumber);
  }, [donations, currentEvent.id]);

  // Expenses filtered for the active event
  const currentExpenses = useMemo(() => {
    return expenses.filter(e => e.eventId === currentEvent.id);
  }, [expenses, currentEvent.id]);

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
      toast.success(`दान प्रविष्टि क्रमांक #${serialNumber} सफलतापूर्वक दर्ज की गई!`);
      return newDonation;
    },
    [currentDonations]
  );

  // Update donation
  const updateDonation = useCallback((id: string, updates: Partial<SamitiDonation>) => {
    setDonations(prev =>
      prev.map(item => {
        if (item.id === id) {
          const accepted = updates.acceptedAmount !== undefined ? updates.acceptedAmount : item.acceptedAmount;
          const received = updates.receivedAmount !== undefined ? updates.receivedAmount : item.receivedAmount;
          const balanceAmount = Math.max(0, accepted - received);

          return {
            ...item,
            ...updates,
            balanceAmount,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    toast.success('दान प्रविष्टि सफलतापूर्वक अपडेट की गई!');
  }, []);

  // Delete donation
  const deleteDonation = useCallback((id: string) => {
    setDonations(prev => prev.filter(item => item.id !== id));
    toast.info('दान प्रविष्टि हटा दी गई!');
  }, []);

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
      toast.success(`खर्चा वाउचर #${voucherNo} सफलतापूर्वक दर्ज हुआ!`);
      return newExpense;
    },
    [currentExpenses.length]
  );

  // Update expense
  const updateExpense = useCallback((id: string, updates: Partial<SamitiExpense>) => {
    setExpenses(prev =>
      prev.map(item => {
        if (item.id === id) {
          const total = updates.totalAmount !== undefined ? updates.totalAmount : item.totalAmount;
          const paid = updates.amountPaid !== undefined ? updates.amountPaid : item.amountPaid;
          const balanceDue = Math.max(0, total - paid);

          return {
            ...item,
            ...updates,
            balanceDue,
          };
        }
        return item;
      })
    );
    toast.success('खर्चा वाउचर अपडेट किया गया!');
  }, []);

  // Delete expense
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
    toast.info('खर्चा वाउचर हटा दिया गया!');
  }, []);

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
      toast.success(`${toInsert.length} दान प्रविष्टियाँ सफलतापूर्वक इम्पोर्ट की गईं!`);
      return toInsert.length;
    },
    [currentDonations]
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
      setCurrentEntityId(newEntityId);
      setCurrentEventId(newEventId);
      toast.success(`नया संगठन/समिति "${newEntity.name}" तैयार हो गया!`);
    },
    []
  );

  // Reset to sample data
  const resetToSampleData = useCallback(() => {
    setEntities(DEFAULT_ENTITIES);
    setEvents(DEFAULT_EVENTS);
    setDonations(SEED_DONATIONS);
    setExpenses(SEED_EXPENSES);
    setCurrentEntityId(DEFAULT_ENTITIES[0].id);
    setCurrentEventId(DEFAULT_EVENTS[0].id);
    toast.success('डेटा को प्रारंभिक नमूना डेटा पर रीसेट कर दिया गया!');
  }, []);

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
        addDonation,
        updateDonation,
        deleteDonation,
        addExpense,
        updateExpense,
        deleteExpense,
        importDonations,
        addEntity,
        resetToSampleData,
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
