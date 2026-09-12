// Mohalla / Tola options used by the donation entry forms (ADDRESS.2).
// Free text is still allowed — this list is only a typing aid.

export const LOCALITY_OPTIONS: string[] = [
  'N/A',
  'जमुनी टोला',
  'काली स्थान',
  'राम नगर',
  'टीडी',
  'डीह पर',
  'पूरब टोला',
  'गोदाम पर',
  'थाना पर',
  'गांधी चौक',
  'बीच गाँव',
  'भदवार',
  'हरिजन टोली',
  'पईनी पर',
  'डगर',
  'बाज़ार',
  'बढ़ई टोली',
  'उत्तर भर',
];

/** Filter the locality list by a free-text query. */
export function filterLocalityOptions(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCALITY_OPTIONS;
  return LOCALITY_OPTIONS.filter(o => o.toLowerCase().includes(q));
}
