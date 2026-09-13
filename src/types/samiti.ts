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

/**
 * One instalment against a donor's pledge. A donor who pays part of the
 * pledge on the day of entry and clears the rest on a later visit gets one
 * entry per visit, so the book shows when each rupee actually came in.
 */
export interface DonationPayment {
  id: string;
  amount: number;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD — the day this instalment was collected
  collectorName?: string;
  note?: string;
  createdAt: string;
}

export interface SamitiDonation {
  id: string;
  eventId: string;
  serialNumber: number; // S.NUM from Excel
  category: DonationCategory; // VIL/EMP/SHO/OTH
  name: string; // NAME
  identity: string; // IDENTITY (Father/Firm/Mobile/Designation)
  caste: string; // CASTE (Demographic tag)
  village?: string; // गाँव (Village)
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
  /**
   * Instalment log behind receivedAmount. Rows created before this existed
   * (and Excel imports) carry no log, so an empty list means "the received
   * amount came in on `date`" — never "nothing was paid".
   */
  payments?: DonationPayment[];
  createdAt: string;
  updatedAt: string;
}


export type ExpenseCategory =
  | 'pandal_tent'
  | 'stage_manch'
  | 'idol_murti'
  | 'idol_decoration'
  | 'sound_system'
  | 'lighting'
  | 'puja_samagri'
  | 'priest_dakshina'
  | 'generator_rent'
  | 'diesel_fuel'
  | 'security_permits'
  | 'cultural_stage'
  | 'visarjan'
  | 'misc'
  | 'other_essential';

export interface ExpenseCategoryInfo {
  code: ExpenseCategory;
  labelEn: string;
  labelHi: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, ExpenseCategoryInfo> = {
  pandal_tent: { code: 'pandal_tent', labelEn: 'Grand Pandal Construction', labelHi: 'भव्य पंडाल निर्माण', icon: '⛺' },
  stage_manch: { code: 'stage_manch', labelEn: 'Grand Stage Construction', labelHi: 'भव्य मंच निर्माण', icon: '🎪' },
  idol_murti: { code: 'idol_murti', labelEn: 'Maa Durga Idol Construction', labelHi: 'माँ दुर्गा भव्य प्रतिमा निर्माण', icon: '🪔' },
  idol_decoration: { code: 'idol_decoration', labelEn: 'Maa Durga Grand Decoration', labelHi: 'माँ दुर्गा भव्य सजावट', icon: '🌺' },
  sound_system: { code: 'sound_system', labelEn: 'Sound System', labelHi: 'ध्वनि विस्तारक', icon: '🔊' },
  lighting: { code: 'lighting', labelEn: 'Illumination & Lighting', labelHi: 'प्रकाश सज्जा', icon: '💡' },
  puja_samagri: { code: 'puja_samagri', labelEn: 'Havan, Puja, Mahaprasad & Flowers', labelHi: 'हवन, पूजन, महाप्रसाद सामग्री एवं पुष्पमाला', icon: '🌸' },
  priest_dakshina: { code: 'priest_dakshina', labelEn: 'Acharya, Purohit & Brahmin Dakshina', labelHi: 'आचार्य, पुरोहित एवं ब्राह्मण दक्षिणा', icon: '🙏' },
  generator_rent: { code: 'generator_rent', labelEn: 'Generator Rent', labelHi: 'जनरेटर किराया', icon: '⚡' },
  diesel_fuel: { code: 'diesel_fuel', labelEn: 'Diesel Fuel', labelHi: 'डीजल ईंधन', icon: '🛢️' },
  security_permits: { code: 'security_permits', labelEn: 'Permissions, CCTV & Security', labelHi: 'प्रशासनिक अनुमति, सीसीटीवी एवं सुरक्षा', icon: '🛡️' },
  cultural_stage: { code: 'cultural_stage', labelEn: 'Cultural Stage, Bhajan Sandhya & Artists', labelHi: 'सांस्कृतिक मंच, भजन संध्या व कलाकार', icon: '🎭' },
  visarjan: { code: 'visarjan', labelEn: 'Shobhayatra Vehicle Rent & Visarjan', labelHi: 'शोभायात्रा वाहन किराया एवं विसर्जन', icon: '🚜' },
  misc: { code: 'misc', labelEn: 'Receipt Books, Banners, Publicity & Misc', labelHi: 'रसीद बुक, बैनर, प्रचार एवं विविध', icon: '📋' },
  other_essential: { code: 'other_essential', labelEn: 'Other Essential Expenses', labelHi: 'अन्य जरूरी खर्च', icon: '📌' },
};

/**
 * One instalment paid to a vendor against a voucher. A bill settled with an
 * advance and cleared later gets one entry per payment, so the ledger shows
 * when each rupee actually left the fund.
 */
export interface ExpensePayment {
  id: string;
  amount: number;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD — the day this instalment was paid
  paidBy?: string;
  note?: string;
  createdAt: string;
}

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
  /**
   * Instalment log behind amountPaid. Vouchers created before this existed
   * carry no log, so an empty list means "the paid amount went out on
   * `expenseDate`" — never "nothing was paid".
   */
  payments?: ExpensePayment[];
  createdAt: string;
  updatedAt?: string;
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
