import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import teamLogo from '@/assets/team-logo.png';
import { scrollToSection, toWhatsAppUrl } from '@/components/landing/landingUtils';

interface HeroSectionProps {
  name?: string;
  title?: string;
  phone?: string | null;
}

const HIGHLIGHTS = ['24x7 जन-शिकायत प्रणाली', 'युवा रोजगार मार्गदर्शन', 'पारदर्शी व जवाबदेह राजनीति'];

const STATS = [
  { value: '50+', label: 'ग्राम एवं वार्ड क्षेत्र', note: 'सक्रिय जनसंपर्क नेटवर्क' },
  { value: '15,000+', label: 'नागरिक संवाद', note: 'सीधा जन-जुड़ाव एवं समाधान' },
  { value: '24x7', label: 'डिजिटल सहायता', note: 'WhatsApp एवं पोर्टल हेल्पलाइन' },
  { value: '1,000+', label: 'युवा कार्यकर्ता', note: 'Team SPS संगठनात्मक शक्ति' },
];

/** The leader's official logo set in a sun-ray seal — "Suraj" is the sun. */
const SunSeal: React.FC<{ name: string; title: string }> = ({ name, title }) => (
  <div className="relative mx-auto h-[280px] w-[280px] xs:h-[340px] xs:w-[340px] sm:h-[410px] sm:w-[410px]">
    <div aria-hidden="true" className="sun-rays absolute -inset-[22%] animate-spin-slow motion-reduce:animate-none" />

    {/* Rotating seal text */}
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="absolute inset-0 h-full w-full animate-spin-slow-reverse motion-reduce:animate-none"
    >
      <defs>
        <path id="hero-seal-ring" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" />
      </defs>
      <circle cx="100" cy="100" r="97" fill="none" stroke="#E8601C" strokeOpacity="0.35" strokeDasharray="1 3" />
      <text fill="#0F1E3D" fontSize="9" fontWeight="700" letterSpacing="1" style={{ fontFamily: 'Mukta, Poppins, sans-serif' }}>
        <textPath href="#hero-seal-ring" xlinkHref="#hero-seal-ring" textLength="536" lengthAdjust="spacing">
          TEAM SURAJ PRATAP ✦ BUILDING THE FUTURE OF POLITICS ✦
        </textPath>
      </text>
    </svg>

    {/* Portrait disc */}
    <div className="absolute inset-[14%] overflow-hidden rounded-full bg-white shadow-[0_30px_60px_-20px_rgba(201,74,8,0.45)] ring-[6px] ring-marigold/80">
      <img
        src={teamLogo}
        alt={`${name} — Team SPS`}
        className="h-full w-full object-contain p-1"
        width={512}
        height={512}
      />
    </div>

    {/* Name plate */}
    <div className="absolute -bottom-6 left-1/2 w-max max-w-[95%] -translate-x-1/2 rounded-2xl bg-ink px-5 py-3 text-center shadow-[0_18px_40px_-16px_rgba(15,30,61,0.7)]">
      <div className="font-display text-2xl leading-tight text-white">{name}</div>
      <div className="mt-0.5 text-[13px] font-semibold leading-snug text-marigold">{title}</div>
    </div>
  </div>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  name = 'सुरज प्रताप',
  title = 'संस्थापक एवं मुख्य मार्गदर्शक - Team SPS',
  phone,
}) => {
  const whatsappUrl = toWhatsAppUrl(phone, 'नमस्ते सुरज प्रताप जी, मैं Team SPS के साथ जुड़ना चाहता/चाहती हूँ।');

  return (
    <section className="relative overflow-hidden bg-paper pb-16 pt-28 lg:pb-24 lg:pt-36" id="hero-section">
      {/* Morning light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 -top-48 h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(244,165,28,0.32),rgba(232,96,28,0.10)_45%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(18,128,58,0.10),transparent_70%)]"
      />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
          {/* Copy */}
          <div className="text-center lg:col-span-7 lg:text-left">
            <p className="hero-rise inline-flex items-center gap-2 rounded-full border border-kesar/30 bg-white/70 px-4 py-1.5 text-sm font-bold text-kesar-deep">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-70 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
              </span>
              जनसेवा • शुचिता • तकनीक
            </p>

            <h1
              className="hero-rise mt-6 font-display text-[2.6rem] leading-[1.22] text-ink xs:text-5xl sm:text-6xl xl:text-[4.6rem]"
              style={{ animationDelay: '80ms' }}
            >
              राजनीति में शुचिता,
              <br />
              <span className="relative inline-block text-kesar-deep">
                तकनीक से जनक्रांति
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-3 w-full text-marigold"
                >
                  <path d="M2 9 C 60 2, 140 2, 298 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </h1>

            <p
              className="hero-rise mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink/70 lg:mx-0"
              style={{ animationDelay: '160ms' }}
            >
              <strong className="font-bold text-ink">{name}</strong> के नेतृत्व में Team SPS का एक ही संकल्प — हर नागरिक की
              समस्या का त्वरित डिजिटल निवारण, पारदर्शी स्थानीय शासन, और समर्पित युवा नेतृत्व।
            </p>

            <div
              className="hero-rise mt-9 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start sm:justify-center"
              style={{ animationDelay: '240ms' }}
            >
              <button
                onClick={() => scrollToSection('join-team-section')}
                id="hero-join-btn"
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-kesar-deep px-8 text-base font-bold text-white shadow-[0_14px_30px_-12px_rgba(201,74,8,0.8)] transition-all hover:-translate-y-0.5 hover:bg-[#B43F05] sm:w-auto"
              >
                <Users className="h-5 w-5" />
                Team SPS से जुड़ें
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="hero-whatsapp-btn"
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-ink/15 bg-white px-7 text-base font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-leaf hover:text-leaf sm:w-auto"
              >
                <MessageCircle className="h-5 w-5 text-leaf" />
                WhatsApp पर संवाद
              </a>
              <Link
                to="/janta"
                id="hero-portal-link"
                className="group inline-flex h-14 items-center gap-2 px-3 text-base font-bold text-ink underline decoration-kesar/40 decoration-2 underline-offset-8 hover:decoration-kesar"
              >
                जनता पोर्टल देखें
                <ArrowRight className="h-4 w-4 text-kesar transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <ul
              className="hero-rise mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] font-medium text-ink/70 lg:justify-start"
              style={{ animationDelay: '320ms' }}
            >
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-leaf" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Seal */}
          <div className="hero-rise lg:col-span-5" style={{ animationDelay: '200ms' }}>
            <SunSeal name={name} title={title} />
          </div>
        </div>

        {/* Impact stats */}
        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-[28px] bg-white/10 shadow-[0_30px_60px_-30px_rgba(15,30,61,0.6)] lg:mt-24 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-ink px-5 py-7 text-center sm:px-8 sm:py-9 lg:text-left">
              <div className="font-display text-4xl leading-none text-marigold sm:text-5xl">{stat.value}</div>
              <div className="mt-3 text-base font-bold text-white">{stat.label}</div>
              <div className="mt-0.5 text-sm text-white/60">{stat.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
