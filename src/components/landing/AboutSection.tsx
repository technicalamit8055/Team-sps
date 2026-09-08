import React from 'react';
import { Target, HeartHandshake, Lightbulb, ShieldCheck, CheckCircle, ChevronRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import teamLogo from '@/assets/team-logo.png';
import rallyBanner from '@/assets/rally-banner.jpg';

interface AboutSectionProps {
  name?: string;
  title?: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  name = 'सुरज प्रताप',
  title = 'संस्थापक एवं मार्गदर्शक - Team SPS'
}) => {
  const scrollToConnect = () => {
    const el = document.getElementById('connect-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden" id="about-section">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-victory-saffron/10 text-victory-saffron text-xs font-semibold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>परिचय एवं दृष्टिकोण | About Leader</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {name}: जनसेवा और नव-राजनीति का सशक्त चेहरा
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            परंपरागत राजनीति से परे, तकनीक और ईमानदारी के दम पर हर नागरिक के जीवन में सकारात्मक बदलाव लाने का संकल्प।
          </p>
        </div>

        {/* Narrative & Visual Grid */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Visual Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-card">
              <img
                src={rallyBanner}
                alt="सुरज प्रताप जनसभा एवं संवाद"
                className="w-full h-80 lg:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs font-bold uppercase tracking-wider text-victory-saffron">
                  जनभागीदारी एवं संवाद
                </span>
                <h4 className="text-xl font-bold mt-1">
                  &ldquo;जनता की ताकत ही लोकतंत्र का आधार है&rdquo;
                </h4>
                <p className="text-xs text-white/80 mt-1">
                  वार्ड और पंचायतों में नियमित चौपाल और सीधा संवाद
                </p>
              </div>
            </div>

            {/* Floating Achievement Card */}
            <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-card/95 backdrop-blur-xl border border-victory-saffron/30 rounded-2xl p-4 shadow-xl max-w-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-victory-saffron/15 text-victory-saffron flex items-center justify-center flex-shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">जनहित सर्वोपरि</div>
                  <div className="text-xs text-muted-foreground">बिना किसी भेदभाव के 24x7 सेवा</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Narrative Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-base">
              <p>
                <strong className="text-foreground">{name}</strong> आधुनिक भारत के उन युवा नेतृत्वकर्ताओं में से हैं, जो मानते हैं कि राजनीति केवल चुनाव लड़ने का साधन नहीं, बल्कि समाज के अंतिम व्यक्ति तक न्याय और विकास पहुँचाने का पवित्र माध्यम है।
              </p>
              <p>
                <strong className="text-victory-navy">Team SPS (Suraj Pratap Sena / Team)</strong> की स्थापना इसी सोच के साथ की गई कि स्थानीय स्तर पर समस्याओं का त्वरित और पारदर्शी निस्तारण किया जाए। चाहे वह राशन कार्ड की समस्या हो, सड़क-नाली निर्माण, विधवा एवं वृद्धावस्था पेंशन, या युवाओं को करियर व रोजगार मार्गदर्शन — सुरज प्रताप की टीम हर मोर्चे पर मुस्तैद रहती है।
              </p>
            </div>

            {/* Core Values Badges */}
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-card border border-border/80 hover:border-victory-saffron/40 transition-colors">
                <ShieldCheck className="w-6 h-6 text-victory-saffron mb-2" />
                <h4 className="font-bold text-sm text-foreground">पारदर्शिता</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  हर योजना और काम का डिजिटल ब्यौरा सार्वजनिक।
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/80 hover:border-victory-saffron/40 transition-colors">
                <Lightbulb className="w-6 h-6 text-amber-500 mb-2" />
                <h4 className="font-bold text-sm text-foreground">स्मार्ट समाधान</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  ऑनलाइन पोर्टल और WhatsApp से सीधी शिकायत दर्ज।
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/80 hover:border-victory-saffron/40 transition-colors">
                <Target className="w-6 h-6 text-indian-green mb-2" />
                <h4 className="font-bold text-sm text-foreground">युवा स्वावलंबन</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  क्षेत्र के युवाओं को मंच और नेतृत्व के नए अवसर।
                </p>
              </div>
            </div>

            {/* Quote Block */}
            <div className="border-l-4 border-victory-saffron pl-4 py-2 bg-victory-saffron/5 rounded-r-xl">
              <p className="text-sm font-semibold text-foreground italic">
                &ldquo;हमारा ध्येय भाषण नहीं, धरातल पर समाधान देना है। राजनीति का भविष्य वही युवा तय करेंगे जो समाज को अपना परिवार मानते हैं।&rdquo;
              </p>
              <span className="text-xs text-victory-saffron font-bold block mt-1">
                — सुरज प्रताप
              </span>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Button
                onClick={scrollToConnect}
                variant="outline"
                className="rounded-xl border-victory-saffron/40 text-victory-saffron hover:bg-victory-saffron hover:text-white"
              >
                सीधा संवाद करें या संदेश भेजें
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
