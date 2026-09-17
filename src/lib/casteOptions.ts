// Caste / Samaj options used by the donation entry forms.
// This is the fixed list the dropdown offers — selection only, no free text.

export interface CasteOption {
  /** Value stored on the donation record. */
  value: string;
  /** Extra words matched while searching (English spellings, common aliases). */
  aliases: string[];
}

export const CASTE_OPTIONS: CasteOption[] = [
  { value: 'ब्राह्मण', aliases: ['brahmin', 'brahman', 'pandit', 'mishra', 'tiwari'] },
  { value: 'राजपूत', aliases: ['rajput', 'kshatriya', 'thakur', 'singh'] },
  { value: 'लाला', aliases: ['lala', 'kayasth', 'kayastha'] },
  { value: 'यादव', aliases: ['yadav', 'ahir', 'gwala'] },
  { value: 'बनिया', aliases: ['bania', 'baniya', 'vaishya', 'vaish'] },
  { value: 'तेली', aliases: ['teli', 'sahu'] },
  { value: 'हलवाई', aliases: ['halwai', 'gupta', 'modanwal'] },
  { value: 'कानू', aliases: ['kanu'] },
  { value: 'कहार', aliases: ['kahar', 'chandravanshi'] },
  { value: 'कुम्हार', aliases: ['kumhar', 'prajapati'] },
  { value: 'लोहार', aliases: ['lohar', 'vishwakarma'] },
  { value: 'बढ़ई', aliases: ['badhai', 'barhai', 'carpenter', 'vishwakarma', 'sharma'] },
  { value: 'पासी', aliases: ['pasi'] },
  { value: 'पासवान', aliases: ['paswan', 'dusadh'] },
  { value: 'गड़ेरी', aliases: ['gaderi', 'gaderiya', 'pal', 'baghel'] },
  { value: 'राम', aliases: ['ram', 'ravidas', 'chamar'] },
  { value: 'कोइरी', aliases: ['koiri', 'kushwaha', 'maurya'] },
  { value: 'कुर्मी', aliases: ['kurmi', 'patel', 'verma'] },
  { value: 'नाई', aliases: ['nai', 'savita', 'thakur'] },
  { value: 'मुस्लिम', aliases: ['muslim', 'musalman'] },
  { value: 'मुसहर', aliases: ['musahar', 'manjhi'] },
  { value: 'लागू नहीं (N/A)', aliases: ['na', 'n/a', 'not applicable', 'lagu nahi', 'none'] },
];
