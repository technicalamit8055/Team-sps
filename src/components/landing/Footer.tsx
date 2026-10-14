import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Calendar, ArrowUp, Phone, Mail, MapPin } from 'lucide-react';
import teamLogo from '@/assets/team-logo.png';
import { SunGlyph } from '@/components/landing/shared';
import { scrollToSection } from '@/components/landing/landingUtils';

interface FooterProps {
  name?: string;
  phone?: string | null;
  email?: string | null;
}

const SECTION_LINKS = [
  { id: 'about-section', label: 'परिचय एवं नेतृत्व' },
  { id: 'initiatives-section', label: 'प्रमुख पहल एवं विज़न' },
  { id: 'portal-section', label: 'जनता पोर्टल कैसे काम करता है' },
  { id: 'join-team-section', label: 'टीम से जुड़ें' },
  { id: 'connect-section', label: 'डिजिटल संवाद एवं संपर्क' },
];

const PORTAL_LINKS = [
  { to: '/janta', label: 'जनता पोर्टल', icon: Users },
  { to: '/durga-puja-unit', label: 'समिति एवं इवेंट डैशबोर्ड', icon: Calendar },
  { to: '/login', label: 'कार्यकर्ता लॉगिन', icon: ShieldCheck },
];

export const Footer: React.FC<FooterProps> = ({
  name = 'सुरज प्रताप',
  phone = '+91 9430588888',
  email = 'teamsurajpratap@gmail.com',
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-ink text-white/70">
      <div aria-hidden="true" className="flex h-1.5">
        <span className="flex-1 bg-kesar" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-leaf" />
      </div>

      <div className="container mx-auto px-4 pb-10 pt-16 lg:px-8">
        {/* Wordmark + CTA */}
        <div className="flex flex-col gap-8 border-b border-white/10 pb-12 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="block h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-marigold">
              <img src={teamLogo} alt="" loading="lazy" className="h-full w-full object-cover object-top" width={64} height={64} />
            </span>
            <div>
              <div className="font-display text-4xl leading-tight text-white sm:text-5xl">{name}</div>
              <div className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-marigold">
                Team SPS · Building the Future of Politics
              </div>
            </div>
          </div>
          <button
            onClick={() => scrollToSection('join-team-section')}
            className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-kesar-deep px-6 font-bold text-white transition-colors hover:bg-[#B43F05] md:self-auto"
          >
            <Users className="h-4 w-4" />
            आंदोलन से जुड़ें
          </button>
        </div>

        {/* Columns */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="max-w-sm leading-relaxed">
              तकनीक, पारदर्शिता और शुचिता के माध्यम से राजनीति को जनता के सशक्तिकरण का सबसे प्रभावी साधन बनाना ही हमारा मिशन है।
            </p>
            <ul className="mt-6 space-y-2.5 text-[15px]">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-marigold" />
                जनसेवा कार्यालय: मुख्य संपर्क केंद्र
              </li>
              {phone && (
                <li>
                  <a href={`tel:${phone}`} className="flex items-center gap-2.5 hover:text-white">
                    <Phone className="h-4 w-4 text-marigold" />
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="flex items-center gap-2.5 break-all hover:text-white">
                    <Mail className="h-4 w-4 flex-shrink-0 text-marigold" />
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <nav className="lg:col-span-4" aria-label="फुटर नेविगेशन">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">नेविगेशन</h4>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {SECTION_LINKS.map((link) => (
                <li key={link.id}>
                  <button onClick={() => scrollToSection(link.id)} className="text-left transition-colors hover:text-marigold">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">नागरिक एवं कार्यकर्ता पोर्टल</h4>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {PORTAL_LINKS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link to={to} className="inline-flex items-center gap-2.5 transition-colors hover:text-marigold">
                    <Icon className="h-4 w-4 text-marigold" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/50 sm:flex-row">
          <p>© {currentYear} Team Suraj Pratap (SPS). सर्वाधिकार सुरक्षित।</p>
          <p className="flex items-center gap-2 font-semibold text-white/70">
            जय हिंद <SunGlyph className="h-3.5 w-3.5 text-marigold" /> जय भारत
          </p>
          <div className="flex items-center gap-4">
            <span>
              Powered by <span className="font-semibold text-marigold">Victory OS v26</span>
            </span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-marigold hover:text-marigold"
              aria-label="ऊपर जाएं"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
