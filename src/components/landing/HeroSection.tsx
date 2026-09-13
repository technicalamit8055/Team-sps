import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MessageCircle,
  ArrowRight,
  Shield,
  Users,
  Award,
  Zap,
  CheckCircle2,
  HeartHandshake,
  Laptop,
  Flame,
  Star,
  Activity,
  MapPin,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import teamLogo from '@/assets/team-logo.png';
import ParticleBackground from '@/components/landing/ParticleBackground';

interface HeroSectionProps {
  name?: string;
  title?: string;
  phone?: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  name = 'सुरज प्रताप',
  title = 'संस्थापक एवं मुख्य मार्गदर्शक - Team SPS',
  phone,
}) => {
  // 3D Card Tilt Interaction State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (py - 0.5) * -14, // rotateX degrees
      y: (px - 0.5) * 14,  // rotateY degrees
    });
    setIsHovered(true);
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const whatsappUrl = phone
    ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        'नमस्ते सुरज प्रताप जी, मैं Team SPS के साथ जुड़ना चाहता/चाहती हूँ।'
      )}`
    : 'https://wa.me/919430588888?text=नमस्ते';

  const scrollToJoin = () => {
    const el = document.getElementById('join-team-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden" id="hero-section">
      {/* 3D Interactive Canvas & Colorful Particle Mesh */}
      <ParticleBackground />

      {/* Radiant Multicolored Ambient Spotlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-10 left-1/4 w-[420px] h-[420px] bg-gradient-to-br from-orange-500/25 via-amber-400/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-36 right-1/4 w-[450px] h-[450px] bg-gradient-to-bl from-emerald-500/25 via-teal-400/15 to-transparent rounded-full blur-3xl animate-pulse stagger-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-r from-blue-600/15 via-indigo-500/10 to-purple-600/15 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: Heading, Badges, Features & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Colorful Tricolor Movement Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-emerald-500/15 border border-orange-500/40 text-foreground text-xs sm:text-sm font-semibold shadow-lg shadow-orange-500/10 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-orange-500 to-amber-500"></span>
              </span>
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 dark:from-orange-400 dark:via-amber-300 dark:to-emerald-400 bg-clip-text text-transparent font-bold">
                🇮🇳 जनसेवा, शुचिता एवं तकनीक का संगम | Team SPS
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            {/* Main Punchy Title */}
            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black tracking-tight text-foreground leading-[1.14]">
              राजनीति में शुचिता, <br />
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 via-yellow-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
                तकनीक से जनक्रांति
              </span>
            </h1>

            {/* Statement / Description */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              <strong className="text-foreground font-bold">{name}</strong> के नेतृत्व में{' '}
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-300">
                Team SPS
              </span>{' '}
              का एक ही संकल्प — हर नागरिक की समस्या का त्वरित डिजिटल निवारण, पारदर्शी स्थानीय शासन, और समर्पित युवा नेतृत्व।
            </p>

            {/* Colorful Feature Chips Grid */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2 text-sm max-w-xl mx-auto lg:mx-0">
              
              {/* Feature 1 - Saffron */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 hover:border-orange-500/50 hover:bg-orange-500/15 transition-all text-left shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-orange-500/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">24x7 जन-शिकायत प्रणाली</div>
                  <div className="text-[13px] text-muted-foreground">त्वरित डिजिटल सुनवाई व ट्रैकिंग</div>
                </div>
              </div>

              {/* Feature 2 - Emerald */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500/50 hover:bg-emerald-500/15 transition-all text-left shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-emerald-500/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">युवा रोजगार व कौशल विकास</div>
                  <div className="text-[13px] text-muted-foreground">आत्मनिर्भर युवा, सशक्त भविष्य</div>
                </div>
              </div>

              {/* Feature 3 - Blue / Navy */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 hover:border-blue-500/50 hover:bg-blue-500/15 transition-all text-left shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">ग्राम-वार्ड बुनियादी सशक्तिकरण</div>
                  <div className="text-[13px] text-muted-foreground">सड़क, प्रकाश, जल व स्वच्छता</div>
                </div>
              </div>

              {/* Feature 4 - Violet / Purple */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 hover:border-purple-500/50 hover:bg-purple-500/15 transition-all text-left shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-purple-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">पारदर्शी व जवाबदेह राजनीति</div>
                  <div className="text-[13px] text-muted-foreground">ईमानदारी और जनता का विश्वास</div>
                </div>
              </div>

            </div>

            {/* Vibrant Call To Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              {/* Primary Glowing Saffron Button */}
              <Button
                onClick={scrollToJoin}
                size="lg"
                id="hero-join-btn"
                className="relative group overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-7 py-6 rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-[1.03] transition-all duration-300"
              >
                <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <Users className="w-5 h-5 mr-2.5" />
                <span>टीम SPS से जुड़ें (Join Movement)</span>
              </Button>

              {/* Glowing WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="hero-whatsapp-btn"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/35 hover:scale-[1.03] transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
                <span>सीधा WhatsApp संवाद</span>
              </a>

              {/* Janta Portal Glass Button */}
              <Link to="/janta" id="hero-portal-link">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-2xl py-6 px-6 border-2 border-orange-500/30 hover:border-orange-500/70 bg-card/80 backdrop-blur-md font-semibold text-foreground hover:bg-orange-500/5 hover:scale-[1.02] transition-all"
                >
                  <span>जनता पोर्टल देखें</span>
                  <ArrowRight className="w-4 h-4 ml-2 text-orange-500" />
                </Button>
              </Link>
            </div>

            {/* Slogan Pill */}
            <div className="pt-2 text-xs text-muted-foreground font-medium flex items-center justify-center lg:justify-start gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>&ldquo;Building the Future of Politics — जन-जन का सम्मान, हर वर्ग का उत्थान&rdquo;</span>
            </div>
          </div>

          {/* Right Column: 3D Interactive Tilt Card with Floating Holographic Badges */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              className="relative w-full max-w-md cursor-pointer select-none"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                perspective: '1000px',
              }}
            >
              {/* Vibrant Multi-layer Rainbow Glowing Aura */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-400 via-teal-400 to-emerald-500 opacity-60 blur-2xl animate-pulse pointer-events-none" />

              {/* Floating Holographic Badge 1: Top Right */}
              <div className="absolute -top-5 -right-4 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-500/50 shadow-xl shadow-amber-500/25 animate-float pointer-events-none">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm">
                  <Star className="w-4 h-4 fill-white" />
                </div>
                <div className="text-left">
                  <div className="text-[12px] text-muted-foreground uppercase font-bold tracking-wider">संकल्प</div>
                  <div className="text-xs font-black text-foreground">100% पारदर्शी नेतृत्व</div>
                </div>
              </div>

              {/* Floating Holographic Badge 2: Bottom Left */}
              <div className="absolute -bottom-5 -left-4 z-30 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/50 shadow-xl shadow-emerald-500/25 animate-float stagger-2 pointer-events-none">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-80" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <div className="text-left">
                  <div className="text-[12px] text-muted-foreground uppercase font-bold tracking-wider">डिजिटल सहायता</div>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">24x7 जनसंवाद केंद्र</div>
                </div>
              </div>

              {/* Floating Holographic Badge 3: Left Center */}
              <div className="absolute top-1/2 -left-6 -translate-y-1/2 z-30 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-blue-500/40 shadow-lg shadow-blue-500/20 animate-float stagger-3 pointer-events-none">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-foreground">सशक्त युवा शक्ति</span>
              </div>

              {/* Interactive 3D Card Body */}
              <div
                className="relative rounded-3xl bg-card/90 backdrop-blur-2xl border-2 border-white/60 dark:border-white/15 shadow-2xl p-6 overflow-hidden transition-transform duration-200 ease-out"
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${
                    isHovered ? 1.02 : 1
                  }, ${isHovered ? 1.02 : 1}, 1)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Dynamic Specular Glare Reflection on Hover */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: isHovered
                      ? `radial-gradient(circle at ${50 + tilt.y * 3}% ${
                          50 - tilt.x * 3
                        }%, rgba(255,255,255,0.25) 0%, transparent 60%)`
                      : 'none',
                  }}
                />

                {/* Top Tricolor Accent Bar */}
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-orange-500 via-white to-emerald-500 mb-5 shadow-sm" />

                {/* Portrait Display Area */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent border border-orange-500/20 p-5 flex flex-col items-center">
                  
                  {/* Glowing Spotlight Behind Portrait */}
                  <div className="absolute top-8 w-44 h-44 rounded-full bg-gradient-to-tr from-orange-500/30 to-amber-300/30 blur-2xl pointer-events-none" />

                  {/* Official Logo / Portrait */}
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                    <img
                      src={teamLogo}
                      alt="सुरज प्रताप - Team SPS"
                      className="w-full h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Leader Info Tag */}
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Team SPS संस्थापक</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-300">
                      {title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      जनसेवक • मार्गदर्शक • युवा नेतृत्व
                    </p>
                  </div>
                </div>

                {/* Quick Badges inside Card */}
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                    <span className="block text-[13px] text-muted-foreground">आदर्श वाक्य</span>
                    <span className="text-xs font-bold text-foreground">सेवा, समर्पण, तकनीक</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="block text-[13px] text-muted-foreground">कार्यक्षेत्र</span>
                    <span className="text-xs font-bold text-foreground">सर्व समाज उत्थान</span>
                  </div>
                </div>

                {/* Quote Banner */}
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/10 border border-orange-500/20 text-center">
                  <p className="text-xs italic text-foreground/90 font-medium">
                    &ldquo;जब तकनीक और निष्ठा मिलती है, तब हर नागरिक की आवाज सीधे सुनी जाती है।&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Colorful Stats & Impact Counters Strip */}
        <div className="mt-16 lg:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          
          {/* Stat 1: Saffron Theme */}
          <div className="relative group p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-orange-500/30 shadow-lg hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              50+
            </div>
            <div className="text-xs sm:text-sm font-bold text-foreground mt-1">ग्राम एवं वार्ड क्षेत्र</div>
            <div className="text-[13px] text-muted-foreground mt-0.5">सक्रिय जनसंपर्क नेटवर्क</div>
          </div>

          {/* Stat 2: Royal Blue / Cyan Theme */}
          <div className="relative group p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-blue-500/30 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              15,000+
            </div>
            <div className="text-xs sm:text-sm font-bold text-foreground mt-1">नागरिक संवाद</div>
            <div className="text-[13px] text-muted-foreground mt-0.5">सीधा जन-जुड़ाव एवं समाधान</div>
          </div>

          {/* Stat 3: Emerald Green Theme */}
          <div className="relative group p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-emerald-500/30 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              24x7
            </div>
            <div className="text-xs sm:text-sm font-bold text-foreground mt-1">डिजिटल सहायता</div>
            <div className="text-[13px] text-muted-foreground mt-0.5">WhatsApp एवं पोर्टल हेल्पलाइन</div>
          </div>

          {/* Stat 4: Ruby / Amber Theme */}
          <div className="relative group p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-amber-500/30 shadow-lg hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-rose-500" />
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              1,000+
            </div>
            <div className="text-xs sm:text-sm font-bold text-foreground mt-1">युवा कार्यकर्ता</div>
            <div className="text-[13px] text-muted-foreground mt-0.5">Team SPS संगठनात्मक शक्ति</div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HeroSection;
