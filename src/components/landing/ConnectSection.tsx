import React, { useState } from 'react';
import { Phone, Mail, Send, ExternalLink, Clock, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getPlatformTheme, getPlatformIcon } from '@/lib/platformThemes';
import { Reveal, SectionKicker } from '@/components/landing/shared';
import { toWhatsAppUrl } from '@/components/landing/landingUtils';

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
  links = [],
}) => {
  const [directMsg, setDirectMsg] = useState({ senderName: '', senderMobile: '', messageContent: '' });
  const [isSending, setIsSending] = useState(false);

  // Fallback social channels if no database links are active
  const defaultSocialChannels = [
    {
      id: 'wa',
      platform: 'whatsapp',
      label: 'WhatsApp सहायता केंद्र',
      url: toWhatsAppUrl(phone, 'नमस्ते सुरज प्रताप जी, मैं आपसे संवाद करना चाहता/चाहती हूँ।'),
    },
    { id: 'fb', platform: 'facebook', label: 'Facebook पेज', url: 'https://facebook.com' },
    { id: 'ig', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
    { id: 'tw', platform: 'twitter', label: 'X (Twitter) अपडेट्स', url: 'https://twitter.com' },
    { id: 'yt', platform: 'youtube', label: 'YouTube वीडियो', url: 'https://youtube.com' },
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

    const waUrl = toWhatsAppUrl(
      phone,
      `नमस्ते सुरज प्रताप जी!\n\nनाम: ${directMsg.senderName}\nमोबाइल: ${directMsg.senderMobile}\n\nसंदेश:\n${directMsg.messageContent}`
    );

    setTimeout(() => {
      setIsSending(false);
      toast.success('संदेश तैयार है! WhatsApp पर संवाद खुल रहा है...');
      window.open(waUrl, '_blank');
      setDirectMsg({ senderName: '', senderMobile: '', messageContent: '' });
    }, 400);
  };

  const contacts = [
    phone && {
      href: `tel:${phone}`,
      icon: Phone,
      label: 'हेल्पलाइन नंबर',
      value: phone,
      tint: 'bg-leaf/10 text-leaf',
      external: false,
    },
    {
      href: toWhatsAppUrl(phone, 'नमस्ते सुरज प्रताप जी'),
      icon: MessageCircle,
      label: 'WhatsApp संवाद',
      value: '24x7 त्वरित संदेश',
      tint: 'bg-[#25D366]/15 text-[#128C4A]',
      external: true,
    },
    email && {
      href: `mailto:${email}`,
      icon: Mail,
      label: 'ईमेल संपर्क',
      value: email,
      tint: 'bg-kesar/10 text-kesar-deep',
      external: false,
    },
  ].filter(Boolean) as {
    href: string;
    icon: typeof Phone;
    label: string;
    value: string;
    tint: string;
    external: boolean;
  }[];

  return (
    <section className="relative bg-white py-20 lg:py-28" id="connect-section">
      <div className="container mx-auto px-4 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionKicker className="justify-center">डिजिटल संवाद एवं संपर्क</SectionKicker>
          <h2 className="mt-4 text-balance font-display text-4xl leading-[1.25] text-ink sm:text-5xl">
            सीधे {name} एवं <span className="text-kesar-deep">Team SPS</span> से जुड़ें
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/65">
            हम हर नागरिक के विचार, समस्या और सुझाव का सम्मान करते हैं। सोशल मीडिया, फोन या सीधे संदेश द्वारा संपर्क करें।
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          {/* Channels */}
          <Reveal className="space-y-6 lg:col-span-5">
            <ul className="divide-y divide-ink/10 overflow-hidden rounded-[24px] border border-ink/10">
              {contacts.map(({ href, icon: Icon, label, value, tint, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex items-center gap-4 p-5 transition-colors hover:bg-paper"
                  >
                    <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink/55">{label}</span>
                      <span className="block truncate text-lg font-bold text-ink">{value}</span>
                    </span>
                    <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-ink/30 transition-colors group-hover:text-kesar" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="rounded-[24px] bg-paper p-6">
              <h3 className="text-lg font-bold text-ink">आधिकारिक सोशल मीडिया चैनल्स</h3>
              <p className="mt-1 text-[15px] text-ink/60">ताजा कार्यक्रमों, जनसभाओं और विकास कार्यों की जानकारी के लिए फॉलो करें।</p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {activeSocialLinks.map((link) => {
                  const theme = getPlatformTheme(link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex h-12 items-center justify-between gap-2 rounded-full px-4 text-[15px] font-semibold transition-transform hover:-translate-y-0.5 ${theme.className}`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {getPlatformIcon(link.platform)}
                        <span className="truncate">{link.label}</span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                    </a>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Message form */}
          <Reveal className="lg:col-span-7" delay={120}>
            <div className="overflow-hidden rounded-[28px] bg-ink text-white">
              <div className="p-6 sm:p-10">
                <span className="text-sm font-bold text-marigold">कार्यालय को सीधा संदेश</span>
                <h3 className="mt-2 font-display text-3xl leading-snug">{name} जी को अपना संदेश या सुझाव भेजें</h3>
                <p className="mt-2 text-[15px] text-white/60">यह संदेश सीधे कार्यालय तक WhatsApp के माध्यम से पहुंचेगा।</p>

                <form onSubmit={handleSendMessage} className="mt-8 space-y-5" id="direct-message-form">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="senderName" className="text-sm font-semibold text-white/85">
                        आपका नाम *
                      </Label>
                      <Input
                        id="senderName"
                        value={directMsg.senderName}
                        onChange={(e) => setDirectMsg({ ...directMsg, senderName: e.target.value })}
                        placeholder="उदा. अमित कुमार"
                        className="h-12 rounded-xl border-white/15 bg-white/5 text-base text-white placeholder:text-white/35 focus-visible:ring-marigold"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="senderMobile" className="text-sm font-semibold text-white/85">
                        मोबाइल नंबर *
                      </Label>
                      <Input
                        id="senderMobile"
                        type="tel"
                        inputMode="numeric"
                        value={directMsg.senderMobile}
                        onChange={(e) => setDirectMsg({ ...directMsg, senderMobile: e.target.value })}
                        placeholder="उदा. 9876543210"
                        className="h-12 rounded-xl border-white/15 bg-white/5 text-base text-white placeholder:text-white/35 focus-visible:ring-marigold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="messageContent" className="text-sm font-semibold text-white/85">
                      संदेश या सुझाव *
                    </Label>
                    <Textarea
                      id="messageContent"
                      value={directMsg.messageContent}
                      onChange={(e) => setDirectMsg({ ...directMsg, messageContent: e.target.value })}
                      placeholder="आप क्षेत्र के संबंध में क्या सुझाव या समस्या साझा करना चाहते हैं..."
                      rows={5}
                      className="resize-none rounded-xl border-white/15 bg-white/5 text-base text-white placeholder:text-white/35 focus-visible:ring-marigold"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-marigold text-base font-bold text-ink transition-colors hover:bg-[#FFB733] disabled:opacity-70"
                  >
                    <Send className="h-4 w-4" />
                    {isSending ? 'संदेश भेजा जा रहा है...' : 'WhatsApp पर संदेश भेजें'}
                  </button>
                </form>

                <p className="mt-5 flex items-center gap-2.5 text-sm text-white/55">
                  <Clock className="h-4 w-4 flex-shrink-0 text-marigold" />
                  हमारी टीम सामान्यतः 2-4 घंटे में प्रत्येक संदेश का संज्ञान लेती है।
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
