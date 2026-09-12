// Caste / Samaj options used by the donation entry forms.
// Free text is still allowed everywhere — this list is only a typing aid.

export interface CasteOption {
  /** Value stored on the donation record. */
  value: string;
  /** Extra words matched while searching (English spellings, common aliases). */
  aliases: string[];
}

export const CASTE_GROUPS: { group: string; options: CasteOption[] }[] = [
  {
    group: 'सामान्य (General)',
    options: [
      { value: 'ब्राह्मण', aliases: ['brahmin', 'brahman', 'pandit', 'panday', 'mishra', 'tiwari'] },
      { value: 'क्षत्रिय / राजपूत', aliases: ['kshatriya', 'rajput', 'thakur', 'singh'] },
      { value: 'भूमिहार', aliases: ['bhumihar'] },
      { value: 'कायस्थ', aliases: ['kayastha', 'kayasth', 'srivastava', 'lal'] },
      { value: 'वैश्य', aliases: ['vaishya', 'vaish', 'bania', 'baniya'] },
      { value: 'अग्रवाल', aliases: ['agarwal', 'agrawal'] },
      { value: 'जैन', aliases: ['jain'] },
      { value: 'मारवाड़ी', aliases: ['marwari'] },
    ],
  },
  {
    group: 'अन्य पिछड़ा वर्ग (OBC)',
    options: [
      { value: 'यादव', aliases: ['yadav', 'ahir', 'gwala'] },
      { value: 'कुर्मी', aliases: ['kurmi', 'patel', 'verma'] },
      { value: 'कुशवाहा / मौर्य', aliases: ['kushwaha', 'maurya', 'koeri', 'shakya', 'saini'] },
      { value: 'लोधी', aliases: ['lodhi', 'lodh'] },
      { value: 'गुर्जर', aliases: ['gurjar', 'gujjar'] },
      { value: 'जाट', aliases: ['jat'] },
      { value: 'स्वर्णकार', aliases: ['swarnkar', 'sonar', 'soni', 'verma'] },
      { value: 'कुम्हार / प्रजापति', aliases: ['kumhar', 'prajapati'] },
      { value: 'विश्वकर्मा / बढ़ई', aliases: ['vishwakarma', 'badhai', 'sharma', 'carpenter'] },
      { value: 'लोहार', aliases: ['lohar'] },
      { value: 'नाई / सविता', aliases: ['nai', 'savita', 'thakur'] },
      { value: 'तेली / साहू', aliases: ['teli', 'sahu'] },
      { value: 'कहार / निषाद', aliases: ['kahar', 'nishad', 'mallah', 'bind'] },
      { value: 'गड़ेरिया / पाल', aliases: ['gaderiya', 'pal', 'baghel'] },
      { value: 'माली', aliases: ['mali'] },
      { value: 'चौरसिया', aliases: ['chaurasia', 'barai'] },
      { value: 'राजभर', aliases: ['rajbhar', 'bhar'] },
      { value: 'कोइरी', aliases: ['koiri'] },
    ],
  },
  {
    group: 'अनुसूचित जाति / जनजाति (SC / ST)',
    options: [
      { value: 'जाटव / चमार', aliases: ['jatav', 'chamar', 'ravidas', 'raidas'] },
      { value: 'पासी', aliases: ['pasi'] },
      { value: 'वाल्मीकि', aliases: ['valmiki', 'balmiki'] },
      { value: 'धोबी', aliases: ['dhobi'] },
      { value: 'कोरी', aliases: ['kori'] },
      { value: 'खटिक', aliases: ['khatik'] },
      { value: 'गोंड', aliases: ['gond'] },
      { value: 'अनुसूचित जनजाति', aliases: ['st', 'adivasi', 'tribal'] },
    ],
  },
  {
    group: 'अन्य समुदाय (Other)',
    options: [
      { value: 'मुस्लिम', aliases: ['muslim', 'musalman'] },
      { value: 'सिख', aliases: ['sikh'] },
      { value: 'ईसाई', aliases: ['christian', 'isai'] },
      { value: 'बौद्ध', aliases: ['buddhist', 'baudh'] },
      { value: 'अन्य', aliases: ['other', 'anya'] },
    ],
  },
];

export const CASTE_OPTIONS: CasteOption[] = CASTE_GROUPS.flatMap(g => g.options);

/** Filter the grouped list by a free-text query (Hindi value or English alias). */
export function filterCasteGroups(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return CASTE_GROUPS;
  return CASTE_GROUPS
    .map(g => ({
      group: g.group,
      options: g.options.filter(
        o => o.value.toLowerCase().includes(q) || o.aliases.some(a => a.includes(q))
      ),
    }))
    .filter(g => g.options.length > 0);
}
