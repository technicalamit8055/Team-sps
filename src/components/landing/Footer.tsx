import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Users, Calendar, ArrowUp } from 'lucide-react';
import teamLogo from '@/assets/team-logo.png';

interface FooterProps {
  name?: string;
  phone?: string | null;
  email?: string | null;
}

export const Footer: React.FC<FooterProps> = ({
  name = 'सुरज प्रताप',
  phone = '+91 9430588888',
  email = 'teamsurajpratap@gmail.com'
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 relative pt-16 pb-12 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-victory-saffron bg-white p-0.5">
                <img
                  src={teamLogo}
                  alt="Team Suraj Pratap Logo"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <span className="font-extrabold text-xl text-white tracking-tight">
                  सुरज प्रताप
                </span>
                <span className="block text-xs text-victory-saffron font-semibold">
                  Team SPS | Building the Future of Politics
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              तकनीक, पारदर्शिता और शुचिता के माध्यम से राजनीति को जनता के सशक्तिकरण का सबसे प्रभावी साधन बनाना ही हमारा मिशन है।
            </p>

            <div className="pt-2 text-xs text-slate-400">
              <p>📍 जनसेवा कार्यालय: मुख्य संपर्क केंद्र</p>
              {phone && <p className="mt-1">📞 हेल्पलाइन: <a href={`tel:${phone}`} className="text-white hover:underline">{phone}</a></p>}
              {email && <p className="mt-1">✉️ ईमेल: <a href={`mailto:${email}`} className="text-white hover:underline">{email}</a></p>}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              नेविगेशन (Navigation)
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('about-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-victory-saffron transition-colors"
                >
                  परिचय एवं नेतृत्व (About)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('initiatives-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-victory-saffron transition-colors"
                >
                  प्रमुख पहल एवं विज़न (Initiatives)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('join-team-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-victory-saffron transition-colors"
                >
                  टीम से जुड़ें (Join Team SPS)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('connect-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-victory-saffron transition-colors"
                >
                  डिजिटल संवाद एवं संपर्क (Connect)
                </button>
              </li>
            </ul>
          </div>

          {/* Citizen & Team Portals */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              नागरिक एवं कार्यकर्ता पोर्टल
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link
                  to="/janta"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-victory-saffron transition-colors"
                >
                  <Users className="w-4 h-4 text-victory-saffron" />
                  <span>जनता पोर्टल (Janta Portal)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/durga-puja-unit"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-victory-saffron transition-colors"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>समिति एवं इवेंट डैशबोर्ड</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-victory-saffron transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-indian-green" />
                  <span>कार्यकर्ता लॉगिन (Team Login)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Back to top action */}
          <div className="lg:col-span-2 flex flex-col justify-between items-start lg:items-end">
            <button
              onClick={scrollToTop}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-victory-saffron transition-all group flex items-center gap-2 text-xs"
            >
              <span>ऊपर जाएं</span>
              <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-victory-saffron" />
            </button>
            <div className="pt-4 text-[11px] text-slate-500 lg:text-right">
              जय हिंद • जय भारत 🇮🇳
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {currentYear} Team Suraj Pratap (SPS). सर्वाधिकार सुरक्षित।
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Powered by</span>
            <span className="font-semibold text-victory-saffron">Victory OS v26</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
