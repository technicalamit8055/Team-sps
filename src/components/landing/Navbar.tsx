import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Users, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import teamLogo from '@/assets/team-logo.png';

interface NavbarProps {
  phone?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ phone }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-md py-2.5'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 group text-left"
          id="nav-brand-logo"
        >
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-victory-saffron shadow-sm group-hover:scale-105 transition-transform bg-white">
            <img
              src={teamLogo}
              alt="Team Suraj Pratap Logo"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg lg:text-xl tracking-tight text-foreground group-hover:text-victory-saffron transition-colors">
                सुरज प्रताप
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-victory-saffron/15 text-victory-saffron border border-victory-saffron/30">
                Team SPS
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
              Building the Future of Politics
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => scrollToSection('about-section')}
            className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-victory-saffron hover:bg-victory-saffron/10 rounded-lg transition-colors"
          >
            परिचय (About)
          </button>
          <button
            onClick={() => scrollToSection('vision-section')}
            className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-victory-saffron hover:bg-victory-saffron/10 rounded-lg transition-colors"
          >
            विज़न (Vision)
          </button>
          <button
            onClick={() => scrollToSection('initiatives-section')}
            className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-victory-saffron hover:bg-victory-saffron/10 rounded-lg transition-colors"
          >
            पहल एवं कार्य (Initiatives)
          </button>
          <button
            onClick={() => scrollToSection('join-team-section')}
            className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-victory-saffron hover:bg-victory-saffron/10 rounded-lg transition-colors"
          >
            टीम से जुड़ें (Join Us)
          </button>
          <button
            onClick={() => scrollToSection('connect-section')}
            className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-victory-saffron hover:bg-victory-saffron/10 rounded-lg transition-colors"
          >
            संपर्क (Connect)
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {phone && (
            <a
              href={`tel:${phone}`}
              id="nav-call-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indian-green/10 text-indian-green border border-indian-green/20 hover:bg-indian-green/20 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>हेल्पलाइन</span>
            </a>
          )}

          <Link to="/janta" id="nav-janta-portal-btn">
            <Button
              variant="outline"
              size="sm"
              className="border-victory-saffron/40 text-victory-saffron hover:bg-victory-saffron hover:text-white font-medium gap-1 text-xs"
            >
              <Users className="w-3.5 h-3.5" />
              जनता पोर्टल
            </Button>
          </Link>

          <Link to="/login" id="nav-login-btn">
            <Button
              size="sm"
              className="bg-victory-navy hover:bg-victory-navy/90 text-white font-medium text-xs shadow-sm gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              कार्यकर्ता लॉगिन
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-muted/60 text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle menu"
          id="nav-mobile-toggle-btn"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-background/95 backdrop-blur-2xl border-b border-border/70 p-5 shadow-2xl transition-all animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => scrollToSection('about-section')}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left font-medium"
            >
              <span>परिचय (About Suraj Pratap)</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => scrollToSection('vision-section')}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left font-medium"
            >
              <span>विज़न एवं प्राथमिकताएं (Vision)</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => scrollToSection('initiatives-section')}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left font-medium"
            >
              <span>प्रमुख पहल एवं कार्य (Initiatives)</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => scrollToSection('join-team-section')}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left font-medium"
            >
              <span>टीम से जुड़ें (Join Team SPS)</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => scrollToSection('connect-section')}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted text-left font-medium"
            >
              <span>सीधा संपर्क एवं सोशल लिंक्स (Connect)</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
              <Link to="/janta" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-victory-saffron text-victory-saffron">
                  <Users className="w-4 h-4 mr-1.5" />
                  जनता पोर्टल
                </Button>
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-victory-navy text-white">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  टीम लॉगिन
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
