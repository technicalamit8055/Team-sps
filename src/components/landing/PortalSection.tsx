import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import digitalSevaImg from '@/assets/digital-seva.jpg';
import { Reveal, SectionKicker } from '@/components/landing/shared';

const STEPS = [
  {
    title: 'शिकायत दर्ज करें',
    text: 'घर बैठे मोबाइल से अपनी समस्या या सुझाव भेजें — राशन, पेंशन, आवास, सड़क या बिजली, हर विषय पर।',
  },
  {
    title: 'लाइव स्टेटस ट्रैकिंग',
    text: 'हर आवेदन ट्रैक होता है, ताकि आप जान सकें कि आपका काम कहाँ तक पहुँचा।',
  },
  {
    title: 'समाधान एवं सूचना',
    text: 'WhatsApp और SMS अलर्ट से हर प्रगति की सीधी जानकारी, बिना किसी बिचौलिए के।',
  },
];

const TRACKER = [
  { label: 'दर्ज', done: true },
  { label: 'प्रक्रिया में', done: true },
  { label: 'समाधान', done: false },
];

/** How the Janta Portal works: the civic-tech promise behind "Building the Future of Politics". */
export const PortalSection: React.FC = () => (
  <section className="relative overflow-hidden bg-ink py-20 text-white lg:py-28" id="portal-section">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-40 top-0 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(232,96,28,0.22),transparent_70%)]"
    />

    <div className="container relative mx-auto grid items-center gap-16 px-4 lg:grid-cols-2 lg:px-8">
      <Reveal>
        <SectionKicker tone="dark">नागरिक सशक्तिकरण</SectionKicker>
        <h2 className="mt-4 text-balance font-display text-4xl leading-[1.25] sm:text-5xl">
          जनता पोर्टल — <span className="text-marigold">शिकायत से समाधान तक</span>
        </h2>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">
          क्या आपके पास कोई समस्या या सुझाव है? सुरज प्रताप की टीम हर आवेदन का त्वरित संज्ञान लेती है।
        </p>

        <ol className="mt-10 space-y-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative pl-16">
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="absolute bottom-[-2rem] left-[21px] top-12 w-px bg-white/15" />
              )}
              <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-kesar text-xl font-extrabold text-white">
                {['१', '२', '३'][i]}
              </span>
              <h3 className="pt-1.5 text-xl font-bold">{step.title}</h3>
              <p className="mt-1 text-base leading-relaxed text-white/65">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/janta"
            className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-marigold px-7 font-bold text-ink transition-colors hover:bg-[#FFB733]"
          >
            जनता पोर्टल पर शिकायत दर्ज करें
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/durga-puja-unit"
            className="inline-flex h-14 items-center justify-center rounded-full border border-white/25 px-7 font-bold text-white transition-colors hover:bg-white/10"
          >
            समिति एवं इवेंट डैशबोर्ड
          </Link>
        </div>
      </Reveal>

      <Reveal delay={150}>
        <div className="relative mb-10 lg:mb-0">
          <img
            src={digitalSevaImg}
            alt="ग्रामीण डिजिटल सेवा केंद्र में नागरिकों की सहायता"
            loading="lazy"
            width={1200}
            height={670}
            className="h-[340px] w-full rounded-[28px] object-cover sm:h-[460px]"
          />

          {/* Illustrative tracker card */}
          <div
            aria-hidden="true"
            className="absolute -bottom-10 left-4 w-[270px] rounded-2xl bg-white p-5 text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] sm:-left-8"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold">आवेदन की स्थिति</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/10 px-2.5 py-0.5 text-xs font-bold text-leaf">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                लाइव
              </span>
            </div>
            <div className="mt-4 flex items-center">
              {TRACKER.map((t, i) => (
                <React.Fragment key={t.label}>
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      t.done ? 'bg-leaf text-white' : 'border-2 border-dashed border-kesar bg-kesar/10'
                    }`}
                  >
                    {t.done && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  {i < TRACKER.length - 1 && (
                    <span className={`h-1 flex-1 ${TRACKER[i + 1].done ? 'bg-leaf' : 'bg-gradient-to-r from-leaf to-kesar/40'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs font-semibold text-ink/60">
              {TRACKER.map((t) => (
                <span key={t.label}>{t.label}</span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);
