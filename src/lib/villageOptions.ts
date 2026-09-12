// गाँव (village) options used by the donation entry forms.
// Free text is still allowed — this list is only a typing aid.

export const VILLAGE_OPTIONS: string[] = [
  'नारायणपुर',
  'छपरापुर',
  'मेहंदी चक',
  'बिसम्भरा',
  'लसाड़ी',
  'सितुहारी',
  'डिलिया',
  'मदनपुर',
  'बघुआई',
  'बेरथ',
  'बरुना',
  'सेवथा',
  'भलुनी',
  'एकवारी',
  'सहार',
  'मुरादपुर',
  'इनुर्खी',
  'अगिआंव',
  'बड़गांव',
];

/** Filter the village list by a free-text query. */
export function filterVillageOptions(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return VILLAGE_OPTIONS;
  return VILLAGE_OPTIONS.filter(o => o.toLowerCase().includes(q));
}
