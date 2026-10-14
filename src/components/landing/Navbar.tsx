import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import teamLogo from '@/assets/team-logo.png';
import { scrollToSection } from '@/components/landing/landingUtils';

interface NavbarProps {
  phone?: string | null;
}

const NAV_ITEMS = [
  { id: 'about-section', label: 'परिचय' },
  { id: 'initiatives-section', label: 'पहल एवं कार्य' },
  { id: 'portal-section', label: 'जनता पोर्टल' },
  { id: 'join-team-section', label: 'टीम से जुड़ें' },
  { id: 'connect-section', label: 'संपर्क' },
];

export const Navbar: React.FC<NavbarProps> = ({ phone }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goTo = (id: string) => {
    setMobileMenuOpen(false);
    scrollToSection(id);
  };

  const solid = isScrolled || mobileMenuOpen;

  return (
    <header
      id="main-navbar"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? 'bg-paper/90 backdrop-blur-xl shadow-[0_1px_0_rgba(15,30,61,0.08),0_8px_24px_-16px_rgba(15,30,61,0.25)]' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:h-[72px] lg:px-8">
        {/* Brand */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center gap-3 text-left"
          id="nav-brand-logo"
          aria-label="सुरज प्रताप — ऊपर जाएं"
        >
          <span className="relative block h-11 w-11 overflow-hidden rounded-full bg-white ring-2 ring-kesar ring-offset-2 ring-offset-paper transition-transform group-hover:scale-105">
            <img src={teamLogo} alt="" className="h-full w-full object-cover object-top" width={44} height={44} />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[1.35rem] text-ink">सुरज प्रताप</span>
            <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.22em] text-kesar-deep">
              Team SPS
            </span>
          </span>
        </button>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="मुख्य नेविगेशन">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              className="group relative px-3.5 py-2 text-[15px] font-semibold text-ink/75 transition-colors hover:text-kesar-deep"
            >
              {item.label}
              <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-kesar transition-transform duration-300 group-hover:scale-x-100" />
            </button>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          {phone && (
            <a
              href={`tel:${phone}`}
              id="nav-call-btn"
              className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-leaf transition-colors hover:bg-leaf/10 xl:inline-flex"
            >
              <Phone className="h-4 w-4" />
              हेल्पलाइन
            </a>
          )}
          <Link
            to="/janta"
            id="nav-janta-portal-btn"
            className="inline-flex h-10 items-center rounded-full border border-ink/15 bg-white/70 px-4 text-sm font-semibold text-ink transition-colors hover:border-kesar hover:text-kesar-deep"
          >
            जनता पोर्टल
          </Link>
          <Link
            to="/login"
            id="nav-login-btn"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-soft"
          >
            <ShieldCheck className="h-4 w-4" />
            कार्यकर्ता लॉगिन
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-full bg-ink/5 p-2.5 text-ink transition-colors hover:bg-ink/10 lg:hidden"
          aria-label={mobileMenuOpen ? 'मेनू बंद करें' : 'मेनू खोलें'}
          aria-expanded={mobileMenuOpen}
          id="nav-mobile-toggle-btn"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-ink/10 bg-paper px-4 pb-6 pt-2 duration-200 animate-in slide-in-from-top-2 lg:hidden">
          <nav className="flex flex-col" aria-label="मोबाइल नेविगेशन">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className="flex items-center justify-between border-b border-ink/10 py-4 text-left text-lg font-semibold text-ink"
              >
                {item.label}
                <ArrowRight className="h-4 w-4 text-kesar" />
              </button>
            ))}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              to="/janta"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-full border border-ink/15 bg-white font-semibold text-ink"
            >
              जनता पोर्टल
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-ink font-semibold text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              टीम लॉगिन
            </Link>
          </div>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full bg-leaf font-semibold text-white"
            >
              <Phone className="h-4 w-4" />
              हेल्पलाइन: {phone}
            </a>
          )}
        </div>
      )}
    </header>
  );
};
