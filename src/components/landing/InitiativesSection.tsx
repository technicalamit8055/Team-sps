import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Laptop, 
  GraduationCap, 
  HeartPulse, 
  Building2, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import digitalSevaImg from '@/assets/digital-seva.jpg';
import rallyImg from '@/assets/rally-banner.jpg';

export const InitiativesSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'digital' | 'youth' | 'infra' | 'welfare'>('all');

  const initiatives = [
    {
      id: 'digital-portal',
      category: 'digital',
      title: 'डिजिटल जन-सहायता केंद्र (Janta Portal)',
      subtitle: 'बिना किसी बिचौलिए के सीधे योजनाओं का लाभ और त्वरित समाधान',
      image: digitalSevaImg,
      icon: Laptop,
      badge: 'लाइव सेवा',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      description:
        'वार्ड और पंचायत के हर नागरिक के लिए ऑनलाइन जन-शिकायत निवारण और सरकारी योजनाओं की पात्रता जांचने का सशक्त माध्यम। हर आवेदन को ट्रैक किया जाता है।',
      points: [
        'घर बैठे शिकायत दर्ज एवं लाइव स्टेटस ट्रैकिंग',
        'राशन, पेंशन और आवास योजनाओं की निशुल्क सहायता',
        'सीधा व्हाट्सएप और SMS अलर्ट सिस्टम'
      ],
      ctaText: 'जनता पोर्टल खोलें',
      ctaLink: '/janta',
      isInternal: true
    },
    {
      id: 'youth-empowerment',
      category: 'youth',
      title: 'युवा नेतृत्व एवं रोजगार मार्गदर्शन',
      subtitle: 'स्थानीय युवाओं को स्वावलंबी और सक्षम बनाने की मुहिम',
      image: rallyImg,
      icon: GraduationCap,
      badge: 'सतत अभियान',
      badgeColor: 'bg-victory-saffron/10 text-victory-saffron border-victory-saffron/30',
      description:
        'Team SPS का युवा विंग युवाओं को प्रतियोगी परीक्षाओं की तैयारी, डिजिटल स्किल्स और रोजगार के अवसरों से जोड़ने के लिए निरंतर कार्यशालाएं आयोजित करता है।',
      points: [
        'करियर काउंसलिंग और प्रतियोगी परीक्षा मार्गदर्शन शिविर',
        'स्थानीय खेलकूद प्रतियोगिताएं और प्रतिभा सम्मान',
        'Team SPS डिजिटल वॉलिंटियर नेटवर्क'
      ],
      ctaText: 'युवा विंग से जुड़ें',
      ctaLink: '#join-team-section',
      isInternal: false
    },
    {
      id: 'health-welfare',
      category: 'welfare',
      title: 'स्वास्थ्य सुरक्षा एवं निःशुल्क मेडिकल कैंप',
      subtitle: 'स्वस्थ समाज ही सशक्त राष्ट्र की नींव है',
      icon: HeartPulse,
      badge: 'जनसेवा',
      badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
      description:
        'बुजुर्गों, माताओं और बच्चों के लिए नियमित स्वास्थ्य जांच शिविर, मुफ्त दवा वितरण, और आपातकालीन चिकित्सा सहायता हेल्पलाइन का संचालन।',
      points: [
        'वरिष्ठ नागरिकों के लिए नेत्र जांच एवं मोतियाबिंद शिविर',
        'आपातकालीन रक्तदान नेटवर्क और एम्बुलेंस सहायता',
        'आयुष्मान भारत कार्ड निर्माण में शत-प्रतिशत सहयोग'
      ],
      ctaText: 'सहायता हेतु संपर्क करें',
      ctaLink: '#connect-section',
      isInternal: false
    },
    {
      id: 'infra-development',
      category: 'infra',
      title: 'ग्राम बुनियादी ढांचा एवं स्वच्छता अभियान',
      subtitle: 'हर गली में रोशनी, हर घर तक स्वच्छ पेयजल',
      icon: Building2,
      badge: 'धरातल पर कार्य',
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      description:
        'कच्ची गलियों का पक्कीकरण, सोलर स्ट्रीट लाइटों की स्थापना, जल-निकासी (नाली) की सफाई और सार्वजनिक स्थानों के कायाकल्प की निरंतर निगरानी।',
      points: [
        'सड़क व नाली निर्माण कार्यों की गुणवत्ता की निगरानी',
        'अंधेरे वाले मोड़ों व चौराहों पर सोलर लाइट व्यवस्था',
        'स्वच्छ जल आपूर्ति एवं हैंडपंप मरम्मत हेल्पलाइन'
      ],
      ctaText: 'क्षेत्र की समस्या बताएं',
      ctaLink: '#connect-section',
      isInternal: false
    },
    {
      id: 'samiti-festivals',
      category: 'welfare',
      title: 'सांस्कृतिक एवं सामाजिक समरसता (Samiti Connect)',
      subtitle: 'धार्मिक और सामाजिक आयोजनों में निःस्वार्थ सहयोग',
      icon: Calendar,
      badge: 'सामुदायिक उत्सव',
      badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      description:
        'दुर्गा पूजा, छठ महापर्व, खेल महोत्सव और स्थानीय सांस्कृतिक समितियों को सुदृढ़ बनाने हेतु समर्पित आयोजन प्रबंधन और डिजिटल सहयोग।',
      points: [
        'पूजा एवं उत्सव समितियों के लिए समर्पित डैशबोर्ड',
        'आयोजन स्थल पर सुरक्षा, पेयजल एवं स्वयंसेवक प्रबंधन',
        'सामाजिक सौहार्द और युवाओं की भागीदारी'
      ],
      ctaText: 'समिति डैशबोर्ड देखें',
      ctaLink: '/samiti',
      isInternal: true
    }
  ];

  const filteredInitiatives = activeCategory === 'all'
    ? initiatives
    : initiatives.filter(item => item.category === activeCategory);

  return (
    <section className="py-20 lg:py-28 relative" id="initiatives-section">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-victory-navy/10 text-victory-navy dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>प्रमुख पहल एवं विज़न | Key Initiatives</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            धरातल पर बदलाव, हर नागरिक तक विकास
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            सुरज प्रताप और Team SPS द्वारा क्षेत्र के सर्वांगीण विकास के लिए चलाए जा रहे प्रमुख जनहितकारी कार्यक्रम।
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeCategory === 'all'
                ? 'bg-victory-saffron text-white shadow-md shadow-victory-saffron/20'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            सभी पहल (All)
          </button>
          <button
            onClick={() => setActiveCategory('digital')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeCategory === 'digital'
                ? 'bg-victory-saffron text-white shadow-md shadow-victory-saffron/20'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            डिजिटल जनसेवा (Digital)
          </button>
          <button
            onClick={() => setActiveCategory('youth')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeCategory === 'youth'
                ? 'bg-victory-saffron text-white shadow-md shadow-victory-saffron/20'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            युवा एवं रोजगार (Youth)
          </button>
          <button
            onClick={() => setActiveCategory('welfare')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeCategory === 'welfare'
                ? 'bg-victory-saffron text-white shadow-md shadow-victory-saffron/20'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            स्वास्थ्य एवं जनकल्याण (Welfare)
          </button>
          <button
            onClick={() => setActiveCategory('infra')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeCategory === 'infra'
                ? 'bg-victory-saffron text-white shadow-md shadow-victory-saffron/20'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            ग्राम अधोसंरचना (Infrastructure)
          </button>
        </div>

        {/* Initiatives Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredInitiatives.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group rounded-3xl bg-card border border-border/70 hover:border-victory-saffron/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Visual Image if available */}
                {item.image && (
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md bg-white/80 dark:bg-black/60 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {!item.image && (
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-victory-saffron/10 text-victory-saffron flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-foreground group-hover:text-victory-saffron transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs font-medium text-victory-saffron mt-0.5">
                      {item.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Bullet Points */}
                    <div className="mt-4 space-y-2">
                      {item.points.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indian-green mt-0.5 flex-shrink-0" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-4 border-t border-border/50">
                    {item.isInternal ? (
                      <Link to={item.ctaLink} className="block">
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-0 h-auto font-semibold text-sm text-victory-saffron hover:text-victory-saffron/80 hover:bg-transparent"
                        >
                          <span>{item.ctaText}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    ) : (
                      <a
                        href={item.ctaLink}
                        className="flex items-center justify-between font-semibold text-sm text-victory-saffron hover:text-victory-saffron/80"
                      >
                        <span>{item.ctaText}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Civic Portal Highlight Banner */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-victory-navy via-slate-900 to-victory-navy p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-victory-saffron/10 skew-x-12 pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <Badge className="bg-victory-saffron text-white hover:bg-victory-saffron/90 text-xs px-3 py-1">
              नागरिक सशक्तिकरण
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              क्या आपके पास कोई समस्या या सुझाव है?
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              जनता पोर्टल पर सीधे अपनी शिकायत या क्षेत्र के विकास का सुझाव दर्ज करें। सुरज प्रताप की टीम हर आवेदन का त्वरित संज्ञान लेती है।
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/janta">
                <Button className="bg-victory-saffron hover:bg-victory-saffron/90 text-white font-bold rounded-xl shadow-lg">
                  जनता पोर्टल पर शिकायत दर्ज करें
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/samiti">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl">
                  समिति एवं इवेंट डैशबोर्ड
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
