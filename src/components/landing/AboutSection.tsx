import React from 'react';
import { ArrowRight } from 'lucide-react';
import rallyBanner from '@/assets/rally-banner.jpg';
import { Reveal, SectionKicker } from '@/components/landing/shared';
import { scrollToSection, toDevanagariIndex } from '@/components/landing/landingUtils';

interface AboutSectionProps {
  name?: string;
  title?: string;
}

const VALUES = [
  { title: 'पारदर्शिता', text: 'हर योजना और काम का डिजिटल ब्यौरा सार्वजनिक।' },
  { title: 'स्मार्ट समाधान', text: 'ऑनलाइन पोर्टल और WhatsApp से सीधी शिकायत दर्ज।' },
  { title: 'युवा स्वावलंबन', text: 'क्षेत्र के युवाओं को मंच और नेतृत्व के नए अवसर।' },
];

export const AboutSection: React.FC<AboutSectionProps> = ({ name = 'सुरज प्रताप' }) => (
  <section className="relative bg-white pb-20 pt-24 lg:pb-28 lg:pt-32" id="about-section">
    <div className="container mx-auto grid items-center gap-16 px-4 lg:grid-cols-12 lg:gap-16 lg:px-8">
      {/* Photo */}
      <Reveal className="lg:col-span-6">
        <div className="relative mb-10 ml-3 mt-3 sm:mb-0">
          <div aria-hidden="true" className="absolute -left-3 -top-3 h-full w-full rounded-[28px] border-2 border-kesar/40" />
          <img
            src={rallyBanner}
            alt="सुरज प्रताप जनसभा एवं संवाद"
            loading="lazy"
            width={1200}
            height={670}
            className="relative h-[320px] w-full rounded-[28px] object-cover sm:h-[440px]"
          />
          <figure className="absolute -bottom-10 left-4 right-4 rounded-2xl bg-ink p-5 text-white shadow-2xl sm:left-auto sm:right-6 sm:max-w-xs">
            <blockquote className="font-display text-xl leading-snug">
              &ldquo;जनता की ताकत ही लोकतंत्र का आधार है&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-sm text-white/65">वार्ड और पंचायतों में नियमित चौपाल और सीधा संवाद</figcaption>
          </figure>
        </div>
      </Reveal>

      {/* Story */}
      <Reveal className="lg:col-span-6" delay={120}>
        <SectionKicker>परिचय एवं दृष्टिकोण</SectionKicker>
        <h2 className="mt-4 text-balance font-display text-4xl leading-[1.25] text-ink sm:text-5xl">
          {name}: <span className="text-kesar-deep">जनसेवा और नव-राजनीति</span> का सशक्त चेहरा
        </h2>

        <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink/70">
          <p>
            <strong className="text-ink">{name}</strong> आधुनिक भारत के उन युवा नेतृत्वकर्ताओं में से हैं, जो मानते हैं कि राजनीति
            केवल चुनाव लड़ने का साधन नहीं, बल्कि समाज के अंतिम व्यक्ति तक न्याय और विकास पहुँचाने का पवित्र माध्यम है।
          </p>
          <p>
            <strong className="text-ink">Team SPS</strong> की स्थापना इसी सोच के साथ की गई कि स्थानीय स्तर पर समस्याओं का त्वरित
            और पारदर्शी निस्तारण किया जाए — राशन कार्ड, सड़क-नाली, विधवा एवं वृद्धावस्था पेंशन, या युवाओं के करियर व रोजगार
            मार्गदर्शन तक, टीम हर मोर्चे पर मुस्तैद रहती है।
          </p>
        </div>

        <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-3">
          {VALUES.map((value, i) => (
            <li key={value.title} className="bg-paper p-5">
              <span className="text-2xl font-extrabold text-kesar">{toDevanagariIndex(i + 1)}</span>
              <h3 className="mt-1 text-lg font-bold text-ink">{value.title}</h3>
              <p className="mt-1 text-[15px] leading-snug text-ink/65">{value.text}</p>
            </li>
          ))}
        </ol>

        <blockquote className="mt-8 border-l-4 border-marigold pl-5">
          <p className="font-display text-2xl leading-snug text-ink">
            &ldquo;हमारा ध्येय भाषण नहीं, धरातल पर समाधान देना है।&rdquo;
          </p>
          <footer className="mt-2 text-sm font-bold text-kesar-deep">— {name}</footer>
        </blockquote>

        <button
          onClick={() => scrollToSection('connect-section')}
          className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink px-6 font-bold text-ink transition-colors hover:bg-ink hover:text-white"
        >
          सीधा संवाद करें या संदेश भेजें
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </Reveal>
    </div>
  </section>
);
