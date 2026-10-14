// Height of the fixed navbar, so a scrolled-to section heading is not hidden
// underneath it.
const NAV_OFFSET = 76;

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.pageYOffset - NAV_OFFSET;
  window.scrollTo({ top, behavior: 'smooth' });
}

export const toWhatsAppUrl = (phone: string | null | undefined, text: string) =>
  `https://wa.me/${(phone || '919430588888').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;

// Devanagari two-digit numerals for list markers: 1 -> "०१".
export const toDevanagariIndex = (n: number) =>
  String(n).padStart(2, '0').replace(/\d/g, (d) => '०१२३४५६७८९'[Number(d)]);
