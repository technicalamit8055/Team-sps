import React, { useState } from 'react';
import { Users, Send, CheckCircle2, MessageCircle, Sparkles, Shield, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

interface JoinTeamSectionProps {
  phone?: string | null;
}

export const JoinTeamSection: React.FC<JoinTeamSectionProps> = ({ phone }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    wardOrPanchayat: '',
    wing: 'youth',
    message: ''
  });
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

  const helplineNumber = phone ? phone.replace(/[^0-9]/g, '') : '919430588888';
  const whatsappJoinUrl = `https://wa.me/${helplineNumber}?text=${encodeURIComponent(
    `जय हिंद! मैं Team SPS में शामिल होना चाहता/चाहती हूँ।\n\nनाम: ${formData.fullName || 'शुभचिंतक'}\nफोन: ${formData.phone || ''}\nक्षेत्र/वार्ड: ${formData.wardOrPanchayat || 'स्थानीय'}\nरुचि विंग: ${formData.wing}`
  )}`;

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-background via-muted/40 to-background relative overflow-hidden" id="join-team-section">
      {/* Subtle Background Elements */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-victory-saffron/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indian-green/10 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-victory-saffron/10 text-victory-saffron text-xs font-semibold uppercase tracking-wider">
            <UserPlus className="w-3.5 h-3.5" />
            <span>जन-आंदोलन का हिस्सा बनें | Join Movement</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Team SPS के साथ जुड़ें, नए नेतृत्व का निर्माण करें
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            यदि आप भी समाज में सकारात्मक बदलाव, पारदर्शी विकास और युवाओं की भागीदारी के पक्षधर हैं, तो आज ही हमारे स्वयंसेवक परिवार से जुड़ें।
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center max-w-5xl mx-auto">
          
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-card border border-border/70 p-6 lg:p-8 shadow-lg space-y-6">
              <h3 className="text-xl font-bold text-foreground">
                Team SPS से क्यों जुड़ें?
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-victory-saffron/15 text-victory-saffron flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground">प्रत्यक्ष समाजसेवा का अवसर</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      वार्ड और पंचायतों के जरूरतमंद परिवारों की सीधी मदद और योजनाओं का लाभ दिलाना।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-victory-navy/15 text-victory-navy dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground">युवा नेतृत्व एवं नेटवर्किंग</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      हजारों कर्मठ युवाओं के साथ मिलकर काम करने और नेतृत्व क्षमता निखारने का मंच।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indian-green/15 text-indian-green flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground">सम्मान एवं आधिकारिक सदस्यता</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      सक्रिय कार्यकर्ताओं को Team SPS की ओर से पहचान पत्र एवं विशेष उत्तरदायित्व।
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="pt-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground mb-2">
                  त्वरित जुड़ाव के लिए सीधे WhatsApp पर संदेश भेजें:
                </p>
                <a
                  href={whatsappJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp पर तुरंत जुड़ें
                </a>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-card border border-border/70 p-6 lg:p-8 shadow-xl relative">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    पंजीकरण सफल रहा!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    स्वागत है <strong className="text-foreground">{formData.fullName}</strong>! Team SPS के संयोजक जल्द आपसे संपर्क करेंगे।
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={whatsappJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp ग्रुप से जुड़ें
                    </a>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          fullName: '',
                          phone: '',
                          wardOrPanchayat: '',
                          wing: 'youth',
                          message: ''
                        });
                      }}
                      className="rounded-xl text-xs"
                    >
                      दूसरा फॉर्म भरें
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" id="join-team-form">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-foreground">
                      स्वयंसेवक पंजीकरण फॉर्म (Volunteer Form)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      नीचे दी गई जानकारी भरें, हम आपसे 24 घंटे में संपर्क करेंगे।
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs font-semibold">
                        पूरा नाम (Full Name) *
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="उदा. राहुल कुमार"
                        className="rounded-xl text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">
                        मोबाइल नंबर / WhatsApp *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="उदा. 9876543210"
                        className="rounded-xl text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="wardOrPanchayat" className="text-xs font-semibold">
                        ग्राम / पंचायत / वार्ड संख्या
                      </Label>
                      <Input
                        id="wardOrPanchayat"
                        value={formData.wardOrPanchayat}
                        onChange={(e) => setFormData({ ...formData, wardOrPanchayat: e.target.value })}
                        placeholder="उदा. वार्ड 12 / पंचायत नाम"
                        className="rounded-xl text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="wing" className="text-xs font-semibold">
                        सहयोग का पसंदीदा क्षेत्र (Wing)
                      </Label>
                      <Select
                        value={formData.wing}
                        onValueChange={(val) => setFormData({ ...formData, wing: val })}
                      >
                        <SelectTrigger className="rounded-xl text-sm">
                          <SelectValue placeholder="विंग चुनें" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youth">युवा विंग (Youth Wing)</SelectItem>
                          <SelectItem value="digital">आईटी एवं सोशल मीडिया सेल (Digital Team)</SelectItem>
                          <SelectItem value="ground">जनसंवाद एवं फील्ड टीम (Ground Team)</SelectItem>
                          <SelectItem value="women">महिला सशक्तिकरण (Women Wing)</SelectItem>
                          <SelectItem value="events">सांस्कृतिक एवं सेवा कार्य (Events)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-semibold">
                      कोई विशेष संदेश या सुझाव (वैकल्पिक)
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="आप टीम के साथ किस प्रकार सहयोग करना चाहते हैं..."
                      rows={3}
                      className="rounded-xl text-sm resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-6 rounded-xl bg-gradient-to-r from-victory-saffron to-amber-600 hover:from-amber-600 hover:to-victory-saffron text-white font-bold text-sm shadow-md transition-all"
                  >
                    {isSubmitting ? (
                      'कृपया प्रतीक्षा करें...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        टीम SPS से जुड़ें (Submit Application)
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
