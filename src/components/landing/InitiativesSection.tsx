import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Laptop, GraduationCap, HeartPulse, Building2, Calendar, ArrowRight, Check, type LucideIcon } from 'lucide-react';
import digitalSevaImg from '@/assets/digital-seva.jpg';
import rallyImg from '@/assets/rally-banner.jpg';
import { Reveal, SectionKicker } from '@/components/landing/shared';
import { scrollToSection, toDevanagariIndex } from '@/components/landing/landingUtils';

type Category = 'all' | 'digital' | 'youth' | 'infra' | 'welfare';

interface Initiative {
  id: string;
  category: Exclude<Category, 'all'>;
  title: string;
  subtitle: string;
  image?: string;
  icon: LucideIcon;
  badge: string;
  description: string;
  points: string[];
  ctaText: string;
  // A route ("/janta") or an on-page section id ("#connect-section").
  ctaLink: string;
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'सभी पहल' },
  { id: 'digital', label: 'डिजिटल जनसेवा' },
  { id: 'youth', label: 'युवा एवं रोजगार' },
  { id: 'welfare', label: 'स्वास्थ्य एवं जनकल्याण' },
  { id: 'infra', label: 'ग्राम अधोसंरचना' },
];

const INITIATIVES: Initiative[] = [
  {
    id: 'digital-portal',
    category: 'digital',
    title: 'डिजिटल जन-सहायता केंद्र',
    subtitle: 'बिना किसी बिचौलिए के सीधे योजनाओं का लाभ',
    image: digitalSevaImg,
    icon: Laptop,
    badge: 'लाइव सेवा',
    description:
      'वार्ड और पंचायत के हर नागरिक के लिए ऑनलाइन जन-शिकायत निवारण और सरकारी योजनाओं की पात्रता जांचने का सशक्त माध्यम। हर आवेदन को ट्रैक किया जाता है।',
    points: ['घर बैठे शिकायत दर्ज एवं लाइव स्टेटस ट्रैकिंग', 'राशन, पेंशन और आवास योजनाओं की निशुल्क सहायता', 'सीधा व्हाट्सएप और SMS अलर्ट सिस्टम'],
    ctaText: 'जनता पोर्टल खोलें',
    ctaLink: '/janta',
  },
  {
    id: 'youth-empowerment',
    category: 'youth',
    title: 'युवा नेतृत्व एवं रोजगार मार्गदर्शन',
    subtitle: 'स्थानीय युवाओं को स्वावलंबी और सक्षम बनाने की मुहिम',
    image: rallyImg,
    icon: GraduationCap,
    badge: 'सतत अभियान',
    description:
      'Team SPS का युवा विंग युवाओं को प्रतियोगी परीक्षाओं की तैयारी, डिजिटल स्किल्स और रोजगार के अवसरों से जोड़ने के लिए निरंतर कार्यशालाएं आयोजित करता है।',
    points: ['करियर काउंसलिंग और प्रतियोगी परीक्षा मार्गदर्शन शिविर', 'स्थानीय खेलकूद प्रतियोगिताएं और प्रतिभा सम्मान', 'Team SPS डिजिटल वॉलिंटियर नेटवर्क'],
    ctaText: 'युवा विंग से जुड़ें',
    ctaLink: '#join-team-section',
  },
  {
    id: 'health-welfare',
    category: 'welfare',
    title: 'स्वास्थ्य सुरक्षा एवं निःशुल्क मेडिकल कैंप',
    subtitle: 'स्वस्थ समाज ही सशक्त राष्ट्र की नींव है',
    icon: HeartPulse,
    badge: 'जनसेवा',
    description:
      'बुजुर्गों, माताओं और बच्चों के लिए नियमित स्वास्थ्य जांच शिविर, मुफ्त दवा वितरण, और आपातकालीन चिकित्सा सहायता हेल्पलाइन का संचालन।',
    points: ['वरिष्ठ नागरिकों के लिए नेत्र जांच एवं मोतियाबिंद शिविर', 'आपातकालीन रक्तदान नेटवर्क और एम्बुलेंस सहायता', 'आयुष्मान भारत कार्ड निर्माण में शत-प्रतिशत सहयोग'],
    ctaText: 'सहायता हेतु संपर्क करें',
    ctaLink: '#connect-section',
  },
  {
    id: 'infra-development',
    category: 'infra',
    title: 'ग्राम बुनियादी ढांचा एवं स्वच्छता',
    subtitle: 'हर गली में रोशनी, हर घर तक स्वच्छ पेयजल',
    icon: Building2,
    badge: 'धरातल पर कार्य',
    description:
      'कच्ची गलियों का पक्कीकरण, सोलर स्ट्रीट लाइटों की स्थापना, जल-निकासी (नाली) की सफाई और सार्वजनिक स्थानों के कायाकल्प की निरंतर निगरानी।',
    points: ['सड़क व नाली निर्माण कार्यों की गुणवत्ता की निगरानी', 'अंधेरे वाले मोड़ों व चौराहों पर सोलर लाइट व्यवस्था', 'स्वच्छ जल आपूर्ति एवं हैंडपंप मरम्मत हेल्पलाइन'],
    ctaText: 'क्षेत्र की समस्या बताएं',
    ctaLink: '#connect-section',
  },
  {
    id: 'samiti-festivals',
    category: 'welfare',
    title: 'सांस्कृतिक एवं सामाजिक समरसता',
    subtitle: 'धार्मिक और सामाजिक आयोजनों में निःस्वार्थ सहयोग',
    icon: Calendar,
    badge: 'सामुदायिक उत्सव',
    description:
      'दुर्गा पूजा, छठ महापर्व, खेल महोत्सव और स्थानीय सांस्कृतिक समितियों को सुदृढ़ बनाने हेतु समर्पित आयोजन प्रबंधन और डिजिटल सहयोग।',
    points: ['पूजा एवं उत्सव समितियों के लिए समर्पित डैशबोर्ड', 'आयोजन स्थल पर सुरक्षा, पेयजल एवं स्वयंसेवक प्रबंधन', 'सामाजिक सौहार्द और युवाओं की भागीदारी'],
    ctaText: 'समिति डैशबोर्ड देखें',
    ctaLink: '/durga-puja-unit',
  },
];

const CardCta: React.FC<{ item: Initiative }> = ({ item }) => {
  const className =
    'flex items-center justify-between border-t border-ink/10 pt-4 font-bold text-kesar-deep transition-colors hover:text-ink';
  const content = (
    <>
      {item.ctaText}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </>
  );

  if (item.ctaLink.startsWith('#')) {
    const id = item.ctaLink.slice(1);
    return (
      <a
        href={item.ctaLink}
        onClick={(e) => {
          e.preventDefault();
          scrollToSection(id);
        }}
        className={className}
      >
        {content}
      </a>
    );
  }
  return (
    <Link to={item.ctaLink} className={className}>
      {content}
    </Link>
  );
};

export const InitiativesSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filtered = activeCategory === 'all' ? INITIATIVES : INITIATIVES.filter((item) => item.category === activeCategory);

  return (
    <section className="relative bg-paper py-20 lg:py-28" id="initiatives-section">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Heading */}
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionKicker>प्रमुख पहल एवं विज़न</SectionKicker>
            <h2 className="mt-4 text-balance font-display text-4xl leading-[1.25] text-ink sm:text-5xl">
              धरातल पर बदलाव, <span className="text-kesar-deep">हर नागरिक तक विकास</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-ink/65 lg:col-span-5">
            सुरज प्रताप और Team SPS द्वारा क्षेत्र के सर्वांगीण विकास के लिए चलाए जा रहे प्रमुख जनहितकारी कार्यक्रम।
          </p>
        </Reveal>

        {/* Filters */}
        <div className="-mx-4 mt-10 overflow-x-auto px-4 pb-2">
          <div className="flex w-max gap-2" role="group" aria-label="पहल श्रेणी चुनें">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={active}
                  className={`h-11 whitespace-nowrap rounded-full px-5 text-[15px] font-semibold transition-colors ${
                    active ? 'bg-ink text-white' : 'border border-ink/15 bg-white text-ink/70 hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const Icon = item.icon;
            const number = toDevanagariIndex(INITIATIVES.indexOf(item) + 1);
            return (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-[24px] border border-ink/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-28px_rgba(15,30,61,0.45)]"
              >
                {item.image ? (
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                    <span className="absolute bottom-2 left-5 text-4xl font-extrabold text-white">{number}</span>
                    <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-leaf">
                      {item.badge}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between px-6 pt-6">
                    <span className="text-5xl font-extrabold leading-none text-kesar/40">{number}</span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kesar/10 text-kesar-deep">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
                  {!item.image && <span className="text-xs font-bold uppercase tracking-wide text-leaf">{item.badge}</span>}
                  <h3 className="mt-1 text-xl font-bold leading-snug text-ink">{item.title}</h3>
                  <p className="mt-1 text-[15px] font-semibold text-kesar-deep">{item.subtitle}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink/65">{item.description}</p>

                  <ul className="mb-6 mt-4 space-y-2">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-[15px] text-ink/85">
                        <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-marigold/25 text-kesar-deep">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <CardCta item={item} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
