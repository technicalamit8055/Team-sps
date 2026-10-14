import React, { useState } from 'react';
import { Users, Send, CheckCircle2, MessageCircle, HandHeart, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Reveal, SectionKicker } from '@/components/landing/shared';
import { toWhatsAppUrl } from '@/components/landing/landingUtils';

interface JoinTeamSectionProps {
  phone?: string | null;
}

const WINGS = [
  { value: 'youth', label: 'युवा विंग' },
  { value: 'digital', label: 'आईटी एवं सोशल मीडिया' },
  { value: 'ground', label: 'जनसंवाद एवं फील्ड टीम' },
  { value: 'women', label: 'महिला सशक्तिकरण' },
  { value: 'events', label: 'सांस्कृतिक एवं सेवा कार्य' },
];

const REASONS = [
  {
    icon: HandHeart,
    title: 'प्रत्यक्ष समाजसेवा का अवसर',
    text: 'वार्ड और पंचायतों के जरूरतमंद परिवारों की सीधी मदद और योजनाओं का लाभ दिलाना।',
  },
  {
    icon: Users,
    title: 'युवा नेतृत्व एवं नेटवर्किंग',
    text: 'हजारों कर्मठ युवाओं के साथ मिलकर काम करने और नेतृत्व क्षमता निखारने का मंच।',
  },
  {
    icon: BadgeCheck,
    title: 'सम्मान एवं आधिकारिक सदस्यता',
    text: 'सक्रिय कार्यकर्ताओं को Team SPS की ओर से पहचान पत्र एवं विशेष उत्तरदायित्व।',
  },
];

const EMPTY_FORM = { fullName: '', phone: '', wardOrPanchayat: '', wing: 'youth', message: '' };

export const JoinTeamSection: React.FC<JoinTeamSectionProps> = ({ phone }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('कृपया अपना नाम दर्ज करें');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error('कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें');
      return;
    }

    setIsSubmitting(true);

    // Simulate submission / prepare WhatsApp link
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('धन्यवाद! आपका आवेदन सफलतापूर्वक प्राप्त हुआ। Team SPS आपसे शीघ्र संपर्क करेगी।');
    }, 600);
  };

  const wingLabel = WINGS.find((w) => w.value === formData.wing)?.label ?? formData.wing;
  const whatsappJoinUrl = toWhatsAppUrl(
    phone,
    `जय हिंद! मैं Team SPS में शामिल होना चाहता/चाहती हूँ।\n\nनाम: ${formData.fullName || 'शुभचिंतक'}\nफोन: ${formData.phone || ''}\nक्षेत्र/वार्ड: ${formData.wardOrPanchayat || 'स्थानीय'}\nरुचि विंग: ${wingLabel}`
  );

  return (
    <section className="relative overflow-hidden bg-paper py-20 lg:py-28" id="join-team-section">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-20 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(244,165,28,0.22),transparent_70%)]"
      />

      <div className="container relative mx-auto grid gap-12 px-4 lg:grid-cols-12 lg:gap-14 lg:px-8">
        {/* Pitch */}
        <Reveal className="lg:col-span-5">
          <SectionKicker>जन-आंदोलन का हिस्सा बनें</SectionKicker>
          <h2 className="mt-4 text-balance font-display text-4xl leading-[1.25] text-ink sm:text-5xl">
            Team SPS से जुड़ें, <span className="text-kesar-deep">नए नेतृत्व</span> का निर्माण करें
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/65">
            यदि आप भी समाज में सकारात्मक बदलाव, पारदर्शी विकास और युवाओं की भागीदारी के पक्षधर हैं, तो आज ही हमारे स्वयंसेवक
            परिवार से जुड़ें।
          </p>

          <ul className="mt-8 space-y-5">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-kesar-deep shadow-sm ring-1 ring-ink/10">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-0.5 text-[15px] leading-snug text-ink/65">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <a
            href={whatsappJoinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-leaf px-6 font-bold text-white transition-colors hover:bg-[#0E6B30]"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp पर तुरंत जुड़ें
          </a>
        </Reveal>

        {/* Form */}
        <Reveal className="lg:col-span-7" delay={120}>
          <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_40px_80px_-40px_rgba(15,30,61,0.45)] ring-1 ring-ink/10">
            <div aria-hidden="true" className="flex h-1.5">
              <span className="flex-1 bg-kesar" />
              <span className="flex-1 bg-white" />
              <span className="flex-1 bg-leaf" />
            </div>

            <div className="p-6 sm:p-10">
              {isSubmitted ? (
                <div className="py-10 text-center duration-300 animate-in fade-in zoom-in-95">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf/10 text-leaf">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 font-display text-3xl text-ink">पंजीकरण सफल रहा!</h3>
                  <p className="mx-auto mt-2 max-w-md text-ink/65">
                    स्वागत है <strong className="text-ink">{formData.fullName}</strong>! Team SPS के संयोजक जल्द आपसे संपर्क करेंगे।
                  </p>
                  <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <a
                      href={whatsappJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-leaf px-6 font-bold text-white hover:bg-[#0E6B30]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp ग्रुप से जुड़ें
                    </a>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData(EMPTY_FORM);
                      }}
                      className="inline-flex h-12 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink hover:border-ink/40"
                    >
                      दूसरा फॉर्म भरें
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" id="join-team-form">
                  <div>
                    <h3 className="font-display text-3xl text-ink">स्वयंसेवक पंजीकरण</h3>
                    <p className="mt-1 text-[15px] text-ink/60">नीचे दी गई जानकारी भरें, हम आपसे 24 घंटे में संपर्क करेंगे।</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-sm font-semibold text-ink">
                        पूरा नाम *
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="उदा. राहुल कुमार"
                        className="h-12 rounded-xl border-ink/15 bg-paper/60 text-base"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-semibold text-ink">
                        मोबाइल नंबर / WhatsApp *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="उदा. 9876543210"
                        className="h-12 rounded-xl border-ink/15 bg-paper/60 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="wardOrPanchayat" className="text-sm font-semibold text-ink">
                      ग्राम / पंचायत / वार्ड संख्या
                    </Label>
                    <Input
                      id="wardOrPanchayat"
                      value={formData.wardOrPanchayat}
                      onChange={(e) => setFormData({ ...formData, wardOrPanchayat: e.target.value })}
                      placeholder="उदा. वार्ड 12 / पंचायत नाम"
                      className="h-12 rounded-xl border-ink/15 bg-paper/60 text-base"
                    />
                  </div>

                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-ink">सहयोग का पसंदीदा क्षेत्र</legend>
                    <div className="flex flex-wrap gap-2">
                      {WINGS.map((wing) => (
                        <label key={wing.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="wing"
                            value={wing.value}
                            checked={formData.wing === wing.value}
                            onChange={() => setFormData({ ...formData, wing: wing.value })}
                            className="peer sr-only"
                          />
                          <span className="inline-flex h-10 items-center rounded-full border border-ink/15 px-4 text-[15px] font-semibold text-ink/70 transition-colors hover:border-ink/40 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-kesar peer-focus-visible:ring-offset-2">
                            {wing.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-sm font-semibold text-ink">
                      कोई विशेष संदेश या सुझाव (वैकल्पिक)
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="आप टीम के साथ किस प्रकार सहयोग करना चाहते हैं..."
                      rows={3}
                      className="resize-none rounded-xl border-ink/15 bg-paper/60 text-base"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-kesar-deep text-base font-bold text-white shadow-[0_14px_30px_-14px_rgba(201,74,8,0.8)] transition-colors hover:bg-[#B43F05] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      'कृपया प्रतीक्षा करें...'
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Team SPS से जुड़ें
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
