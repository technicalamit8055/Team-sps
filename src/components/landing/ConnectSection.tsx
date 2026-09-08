import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Send, 
  ExternalLink, 
  Clock, 
  MessageCircle, 
  Share2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getPlatformTheme, getPlatformIcon } from '@/lib/platformThemes';

interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  color: string | null;
  display_order: number;
}

interface ConnectSectionProps {
  name?: string;
  email?: string | null;
  phone?: string | null;
  links?: SocialLink[];
}

export const ConnectSection: React.FC<ConnectSectionProps> = ({
  name = 'सुरज प्रताप',
  email = 'teamsurajpratap@gmail.com',
  phone = '+91 9430588888',
  links = []
}) => {
  const [directMsg, setDirectMsg] = useState({
    senderName: '',
    senderMobile: '',
    messageContent: ''
  });
  const [isSending, setIsSending] = useState(false);

  // Fallback social channels if no database links are active
  const defaultSocialChannels = [
    {
      id: 'wa',
      platform: 'whatsapp',
      label: 'WhatsApp सहायता केंद्र',
      url: `https://wa.me/${(phone || '919430588888').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('नमस्ते सुरज प्रताप जी, मैं आपसे संवाद करना चाहता/चाहती हूँ।')}`
    },
    {
      id: 'fb',
      platform: 'facebook',
      label: 'Facebook पेज फॉलो करें',
      url: 'https://facebook.com'
    },
    {
      id: 'ig',
      platform: 'instagram',
      label: 'Instagram पर जुड़ें',
      url: 'https://instagram.com'
    },
    {
      id: 'tw',
      platform: 'twitter',
      label: 'X (पूर्व Twitter) पर अपडेट्स',
      url: 'https://twitter.com'
    },
    {
      id: 'yt',
      platform: 'youtube',
      label: 'YouTube वीडियो देखें',
      url: 'https://youtube.com'
    }
  ];

  const activeSocialLinks = links.length > 0 ? links : defaultSocialChannels;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMsg.senderName.trim()) {
      toast.error('कृपया अपना नाम दर्ज करें');
      return;
    }
    if (!directMsg.senderMobile.trim() || directMsg.senderMobile.length < 10) {
      toast.error('कृपया एक मान्य मोबाइल नंबर दर्ज करें');
      return;
    }
    if (!directMsg.messageContent.trim()) {
      toast.error('कृपया अपना संदेश दर्ज करें');
      return;
    }

    setIsSending(true);

    const cleanPhone = (phone || '919430588888').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(
      `नमस्ते सुरज प्रताप जी!\n\nनाम: ${directMsg.senderName}\nमोबाइल: ${directMsg.senderMobile}\n\nसंदेश:\n${directMsg.messageContent}`
    );
    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

    setTimeout(() => {
      setIsSending(false);
      toast.success('संदेश तैयार है! WhatsApp पर संवाद खुल रहा है...');
      window.open(waUrl, '_blank');
      setDirectMsg({ senderName: '', senderMobile: '', messageContent: '' });
    }, 400);
  };

  return (
    <section className="py-20 lg:py-28 relative" id="connect-section">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indian-green/10 text-indian-green text-xs font-semibold uppercase tracking-wider">
            <Share2 className="w-3.5 h-3.5" />
            <span>डिजिटल संवाद एवं संपर्क | Connect</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            सीधे सुरज प्रताप एवं Team SPS से जुड़ें
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            हम हर नागरिक के विचार, समस्या और सुझाव का सम्मान करते हैं। सोशल मीडिया, फोन या सीधे संदेश द्वारा संपर्क करें।
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Left Column: Direct Contact Info & Social Channels */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Contact Cards Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Phone Card */}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="p-5 rounded-2xl bg-card border border-border/80 hover:border-indian-green/50 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="w-10 h-10 rounded-xl bg-indian-green/15 text-indian-green flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">हेल्पलाइन नंबर</span>
                    <p className="text-base font-bold text-foreground mt-0.5">{phone}</p>
                    <span className="text-[11px] text-indian-green font-medium">क्लिक कर कॉल करें</span>
                  </div>
                </a>
              )}

              {/* WhatsApp Card */}
              <a
                href={`https://wa.me/${(phone || '919430588888').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('नमस्ते सुरज प्रताप जी')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium">WhatsApp संवाद</span>
                  <p className="text-base font-bold text-foreground mt-0.5">24x7 त्वरित संदेश</p>
                  <span className="text-[11px] text-emerald-600 font-medium">चैट शुरू करें</span>
                </div>
              </a>

              {/* Email Card */}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="p-5 rounded-2xl bg-card border border-border/80 hover:border-victory-saffron/50 hover:shadow-md transition-all group flex flex-col justify-between sm:col-span-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-victory-saffron/15 text-victory-saffron flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">ईमेल संपर्क</span>
                      <p className="text-sm sm:text-base font-bold text-foreground truncate">{email}</p>
                    </div>
                  </div>
                </a>
              )}
            </div>

            {/* Social Media Links List */}
            <div className="rounded-3xl bg-card border border-border/70 p-6 shadow-sm space-y-3">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <Share2 className="w-4 h-4 text-victory-saffron" />
                आधिकारिक सोशल मीडिया चैनल्स
              </h4>
              <p className="text-xs text-muted-foreground">
                ताजा कार्यक्रमों, जनसभाओं और विकास कार्यों की जानकारी के लिए हमें फॉलो करें:
              </p>

              <div className="grid sm:grid-cols-2 gap-2.5 pt-2">
                {activeSocialLinks.map((link) => {
                  const theme = getPlatformTheme(link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between gap-2 p-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${theme.className}`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {getPlatformIcon(link.platform)}
                        <span className="truncate">{link.label}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    </a>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Direct Message Form to Office */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-card border border-border/70 p-6 lg:p-8 shadow-xl relative">
              <div className="space-y-1 mb-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-victory-saffron">
                  <MessageSquare className="w-3.5 h-3.5" />
                  कार्यालय को सीधा संदेश
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  सुरज प्रताप जी को अपना संदेश या सुझाव भेजें
                </h3>
                <p className="text-xs text-muted-foreground">
                  यह संदेश सीधे सुरज प्रताप जी के कार्यालय तक पहुंचेगा।
                </p>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4" id="direct-message-form">
                <div className="space-y-1.5">
                  <Label htmlFor="senderName" className="text-xs font-semibold">
                    आपका नाम (Your Name) *
                  </Label>
                  <Input
                    id="senderName"
                    value={directMsg.senderName}
                    onChange={(e) => setDirectMsg({ ...directMsg, senderName: e.target.value })}
                    placeholder="उदा. अमित कुमार"
                    className="rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="senderMobile" className="text-xs font-semibold">
                    मोबाइल नंबर (Mobile Number) *
                  </Label>
                  <Input
                    id="senderMobile"
                    type="tel"
                    value={directMsg.senderMobile}
                    onChange={(e) => setDirectMsg({ ...directMsg, senderMobile: e.target.value })}
                    placeholder="उदा. 9876543210"
                    className="rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="messageContent" className="text-xs font-semibold">
                    संदेश या सुझाव (Message / Feedback) *
                  </Label>
                  <Textarea
                    id="messageContent"
                    value={directMsg.messageContent}
                    onChange={(e) => setDirectMsg({ ...directMsg, messageContent: e.target.value })}
                    placeholder="आप क्षेत्र के संबंध में क्या सुझाव या समस्या साझा करना चाहते हैं..."
                    rows={4}
                    className="rounded-xl text-sm resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-6 rounded-xl bg-victory-navy hover:bg-victory-navy/90 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'संदेश भेजा जा रहा है...' : 'WhatsApp पर संदेश प्रेषित करें'}
                </Button>
              </form>

              <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border/50 flex items-center gap-2.5 text-[11px] text-muted-foreground">
                <Clock className="w-4 h-4 text-victory-saffron flex-shrink-0" />
                <span>हमारी टीम सामान्यतः 2-4 घंटे में प्रत्येक संदेश का संज्ञान लेती है।</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
