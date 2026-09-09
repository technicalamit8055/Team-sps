import React from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles, Phone, Users, Clock, MapPin, ShieldCheck, Flame } from 'lucide-react';

interface PujaScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScheduleItem {
  dayNumber: string;
  tithiHi: string;
  date: string;
  eventHi: string;
  rituals: string;
  timing: string;
  icon: string;
  highlight?: boolean;
}

const PUJA_SCHEDULE: ScheduleItem[] = [
  {
    dayNumber: 'दिन 1',
    tithiHi: 'प्रतिपदा (शारदीय नवरात्र शुभारंभ)',
    date: '15 अक्टूबर 2026',
    eventHi: 'घटस्थापना, अखंड ज्योति एवं शैलपुत्री पूजन',
    rituals: 'वैदिक मंत्रोच्चार के साथ कलश स्थापना, देवी आह्वान एवं शाम महाआरती',
    timing: 'प्रातः 07:15 - 10:30',
    icon: '🪔',
  },
  {
    dayNumber: 'दिन 2-5',
    tithiHi: 'द्वितीया से पंचमी',
    date: '16 - 19 अक्टूबर 2026',
    eventHi: 'ब्रह्मचारिणी, चंद्रघंटा, कुष्मांडा व स्कंदमाता पूजन',
    rituals: 'प्रतिदिन दुर्गा सप्तशती पाठ, शाम 7:30 बजे भव्य आरती एवं संकीर्तन',
    timing: 'प्रतिदिन संध्या आरती 07:30 बजे',
    icon: '🌸',
  },
  {
    dayNumber: 'दिन 6',
    tithiHi: 'षष्ठी (महाषष्ठी)',
    date: '20 अक्टूबर 2026',
    eventHi: 'देवी बोधन, आमंत्रण एवं अधिवास',
    rituals: 'बिल्व वृक्ष के नीचे माँ का बोधन, निमंत्रण एवं कलश संस्कार',
    timing: 'सायंकाल 06:00 बजे',
    icon: '🌿',
  },
  {
    dayNumber: 'दिन 7',
    tithiHi: 'महा सप्तमी',
    date: '21 अक्टूबर 2026',
    eventHi: 'नवपत्रिका प्रवेश एवं माँ का भव्य पट अनावरण',
    rituals: 'गंगा जल से नवपत्रिका महास्नान, माँ दुर्गा की नयनोंन्मीलन पूजा, आम जनता हेतु दर्शन प्रारंभ',
    timing: 'प्रातः 08:00 बजे पट खुलेगा',
    icon: '🌺',
    highlight: true,
  },
  {
    dayNumber: 'दिन 8',
    tithiHi: 'महा अष्टमी',
    date: '22 अक्टूबर 2026',
    eventHi: 'महाष्टमी महापूजा, संधि पूजा (108 दीप प्रज्वलन)',
    rituals: 'अष्टमी-नवमी के मिलन काल में 108 कमल पुष्प व 108 दीपों से माँ चामुंडा की विशेष संधि पूजा',
    timing: 'रात्रि 10:45 - 11:35 (संधि पूजा)',
    icon: '🔱',
    highlight: true,
  },
  {
    dayNumber: 'दिन 9',
    tithiHi: 'महा नवमी',
    date: '23 अक्टूबर 2026',
    eventHi: 'महानवमी महायज्ञ, पूर्णाहूति एवं 51 कन्या पूजन',
    rituals: 'भव्य हवन, महाप्रसाद भोग वितरण (खिचड़ी व खीर भंडारा 10,000+ श्रद्धालुओं हेतु)',
    timing: 'हवन दोपहर 12:00 बजे • भंडारा 01:00 बजे से',
    icon: '🍲',
    highlight: true,
  },
  {
    dayNumber: 'दिन 10',
    tithiHi: 'विजयादशमी',
    date: '24 अक्टूबर 2026',
    eventHi: 'सिंदूर खेला, अपराजिता पूजन एवं भव्य विसर्जन शोभायात्रा',
    rituals: 'माताओं द्वारा सिंदूर खेला, ढाक-ढोल व ताशे के साथ विशाल विसर्जन शोभायात्रा एवं गंगा घाट प्रस्थान',
    timing: 'दोपहर 03:00 बजे से विसर्जन यात्रा',
    icon: '🚜',
    highlight: true,
  },
];

export const PujaScheduleModal: React.FC<PujaScheduleModalProps> = ({ isOpen, onClose }) => {
  const { currentEntity, staffList } = useSamiti();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden bg-white border-amber-300 rounded-3xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>पूजा पंचांग, कार्यक्रम एवं समिति पदाधिकारी</span>
            </DialogTitle>
            <p className="text-[11px] text-amber-100 font-medium mt-0.5">
              {currentEntity.name} • 41वाँ वार्षिकोत्सव 2026
            </p>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                स्थान एवं मुख्य पंडाल
              </span>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{currentEntity.location || 'मुख्य चौक, नारायणपुर'}</span>
              </h4>
              <p className="text-xs text-amber-900/80">
                माँ दुर्गा की भव्य 15 फीट प्रतिमा • वाटरप्रूफ अक्षरधाम प्रारूप पंडाल
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-xs inline-flex items-center gap-1">
                <Flame className="w-3 h-3 animate-pulse" />
                महोत्सव 2026
              </span>
            </div>
          </div>

          {/* 9 Days Schedule Timeline */}
          <div className="space-y-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>शारदीय नवरात्र एवं दुर्गा पूजा 9-दिवसीय कार्यक्रमानुसार समय-सारणी</span>
            </h3>

            <div className="space-y-2">
              {PUJA_SCHEDULE.map(item => (
                <div
                  key={item.dayNumber}
                  className={`p-3 rounded-2xl border transition-all ${
                    item.highlight
                      ? 'bg-amber-50/50 border-amber-300 shadow-xs ring-1 ring-amber-400/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 font-serif">
                            {item.eventHi}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${
                              item.highlight
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.tithiHi}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.rituals}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 font-mono block">
                        {item.date}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded block">
                        {item.timing}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Committee Directory */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>समिति प्रमुख पदाधिकारी एवं संपर्क सूत्र (Committee Cadre)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {staffList.slice(0, 6).map(staff => (
                <div
                  key={staff.id}
                  className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{staff.name}</p>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-slate-300 text-slate-600">
                        {staff.primaryRole}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {staff.designation || 'समिति सदस्य'}
                    </p>
                  </div>

                  {staff.phone && (
                    <a
                      href={`tel:${staff.phone}`}
                      className="h-8 px-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 flex items-center gap-1 text-xs font-mono font-semibold shrink-0 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>कॉल करें</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button
            size="sm"
            onClick={onClose}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs px-4"
          >
            समझ गया (Close)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
