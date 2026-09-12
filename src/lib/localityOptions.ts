// Mohalla / Tola options used by the donation entry forms (ADDRESS.2).
// Free text is still allowed — this list is only a typing aid.

export const LOCALITY_OPTIONS: string[] = [
  'PURAB TOLA',
  'GANDHI CHOWK',
  'BHADWAR',
  'PAINI PAR',
  'HORIZON TOLI',
  'DAGAR',
  'JAMUNI TOLA',
  'THANA PAR',
  'GODAM PAR',
  'RAM NAGAR',
  'MUSLIM TOLA EAST',
  'MUSLIM TOLA WEST',
  'KALI STHAN',
  'BICH GAO',
  'BAZAR',
];

/** Filter the locality list by a free-text query. */
export function filterLocalityOptions(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCALITY_OPTIONS;
  return LOCALITY_OPTIONS.filter(o => o.toLowerCase().includes(q));
}
