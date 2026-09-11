export type DonationCategory = 'VIL' | 'EMP' | 'SHO' | 'OTH';

export interface CategoryInfo {
  code: DonationCategory;
  labelEn: string;
  labelHi: string;
  badgeColor: string;
  description: string;
}

export const DONATION_CATEGORIES: Record<DonationCategory, CategoryInfo> = {
  VIL: {
    code: 'VIL',
    labelEn: 'Villager / Resident',
    labelHi: 'ग्रामीण / निवासी',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    description: 'Local village or mohalla resident contribution',
  },
  EMP: {
    code: 'EMP',
    labelEn: 'Employee / Salaried',
    labelHi: 'कर्मचारी / नौकरीपेशा',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    description: 'Government or private sector employee contribution',
  },
  SHO: {
    code: 'SHO',
    labelEn: 'Shopkeeper / Trader',
    labelHi: 'दुकानदार / व्यापारी',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    description: 'Market shop, showroom, or business firm contribution',
  },
  OTH: {
    code: 'OTH',
    labelEn: 'Other / Well-wisher',
    labelHi: 'अन्य / शुभचिंतक',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    description: 'Outstation guests, patrons, or special contributors',
  },
};

export type PaymentMode = 'CASH' | 'ONL' | 'MIXED';

export type EntityType = 'festival_samiti' | 'election' | 'business' | 'rwa' | 'ngo';

export interface MasterEntity {
  id: string;
  name: string;
  type: EntityType;
  upiId?: string;
  tagline?: string;
  location?: string;
  establishedYear?: number;
  registrationNo?: string;
  bannerHeadline?: string;
  bannerBadgeText?: string;
  bannerDatesText?: string;
}

export interface SamitiEvent {
  id: string;
  entityId: string;
  title: string;
  fiscalYear: string;
  targetBudget: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface SamitiDonation {
  id: string;
  eventId: string;
  serialNumber: number; // S.NUM from Excel
  category: DonationCategory; // VIL/EMP/SHO/OTH
  name: string; // NAME
  identity: string; // IDENTITY (Father/Firm/Mobile/Designation)
  caste: string; // CASTE (Demographic tag)
  address1: string; // ADDRESS.1 (Mohalla/Ward/Street)
  address2: string; // ADDRESS.2 (Post/District/Landmark)
  phone: string; // WhatsApp Mobile No.
  acceptedAmount: number; // ACCEPTED AMMOUNT (Pledged)
  receivedAmount: number; // RECEIVABLE AMOUNT (Collected so far)
  balanceAmount: number; // BALANCE AMOUNT (Outstanding: accepted - received)
  paymentMode: PaymentMode; // CASH/ONL
  collectorName?: string; // Volunteer who collected
  isHandoverDone?: boolean; // Cash handed over to Treasurer
  date: string; // Date of entry
  remarks?: string;
  receiptUrl?: string; // Digital / cloud receipt URL
  createdAt: string;
  updatedAt: string;
}


export type ExpenseCategory = 
  | 'pandal_tent' 
  | 'idol_murti' 
  | 'sound_light' 
  | 'bhog_prasad' 
  | 'puja_samagri' 
  | 'priest_dakshina' 
  | 'generator_fuel' 
  | 'security_permits' 
  | 'cultural_stage' 
  | 'visarjan' 
  | 'misc';

export interface ExpenseCategoryInfo {
  code: ExpenseCategory;
  labelEn: string;
  labelHi: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, ExpenseCategoryInfo> = {
  pandal_tent: { code: 'pandal_tent', labelEn: 'Tent & Pandal Decoration', labelHi: 'टेंट एवं भव्य पंडाल निर्माण', icon: '⛺' },
  idol_murti: { code: 'idol_murti', labelEn: 'Maa Durga Murti / Idol', labelHi: 'माँ दुर्गा भव्य प्रतिमा निर्माण', icon: '🪔' },
  sound_light: { code: 'sound_light', labelEn: 'Sound System & Illumination', labelHi: 'ध्वनि विस्तारक एवं प्रकाश सज्जा', icon: '💡' },
  bhog_prasad: { code: 'bhog_prasad', labelEn: 'Bhog, Prasad & Bhandara', labelHi: 'भोग, महाप्रसाद एवं भंडारा सामग्री', icon: '🍲' },
  puja_samagri: { code: 'puja_samagri', labelEn: 'Puja Ritual Samagri & Flowers', labelHi: 'हवन, पूजन सामग्री एवं पुष्पमाला', icon: '🌸' },
  priest_dakshina: { code: 'priest_dakshina', labelEn: 'Acharya & Pandit Dakshina', labelHi: 'आचार्य, पुरोहित एवं ब्राह्मण दक्षिणा', icon: '🙏' },
  generator_fuel: { code: 'generator_fuel', labelEn: 'Silent Generator & Diesel', labelHi: 'जनरेटर किराया एवं डीजल ईंधन', icon: '⚡' },
  security_permits: { code: 'security_permits', labelEn: 'Permissions, CCTV & Security', labelHi: 'प्रशासनिक अनुमति, CCTV एवं सुरक्षा', icon: '🛡️' },
  cultural_stage: { code: 'cultural_stage', labelEn: 'Cultural Stage & Artists', labelHi: 'सांस्कृतिक मंच, भजन संध्या व कलाकार', icon: '🎭' },
  visarjan: { code: 'visarjan', labelEn: 'Shobhayatra & Visarjan Rituals', labelHi: 'शोभायात्रा, वाहन किराया एवं विसर्जन', icon: '🚜' },
  misc: { code: 'misc', labelEn: 'Printing, Stationery & Misc', labelHi: 'रसीद बुक, बैनर, प्रचार एवं विविध', icon: '📋' },
};

export interface SamitiExpense {
  id: string;
  eventId: string;
  voucherNo: string;
  category: ExpenseCategory;
  vendorName: string;
  vendorPhone?: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number; // totalAmount - amountPaid
  paymentMode: PaymentMode;
  expenseDate: string;
  paidBy?: string;
  billReceiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface CashHandoverRecord {
  id: string;
  eventId: string;
  volunteerName: string;
  amount: number;
  status: 'pending' | 'approved';
  handedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

export interface SamitiFinancialSummary {
  totalAccepted: number; // Total pledged chanda
  totalReceived: number; // Total collected chanda
  totalBalance: number; // Total pending dues
  cashReceived: number; // Cash in hand from collections
  onlineReceived: number; // Online/UPI received directly in bank
  totalExpenses: number; // Total expense committed
  expensesPaid: number; // Total expense actually paid
  expenseBalanceDue: number; // Total dues to vendors
  netSurplus: number; // totalReceived - expensesPaid (Net cash reserve)
  totalDonors: number;
  fullyPaidDonors: number;
  partialDonors: number;
  pendingDonors: number;
}
