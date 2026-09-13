import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useSamiti } from '@/contexts/SamitiContext';
import {
  Settings,
  Edit3,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Save,
  Sparkles,
  QrCode,
  MapPin,
  Calendar,
  Building2,
  FileText,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

interface DurgaPujaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'header' | 'reset';
}

export const DurgaPujaSettingsModal: React.FC<DurgaPujaSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'header',
}) => {
  const {
    currentEntity,
    updateEntity,
    currentEvent,
    updateEvent,
    resetDurgaPujaUnitData,
  } = useSamiti();

  const [activeTab, setActiveTab] = useState<'header' | 'reset'>(defaultTab);

  // Form State initialized with currentEntity & currentEvent
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    registrationNo: '',
    upiId: '',
    tagline: '',
    title: '',
    fiscalYear: '',
    targetBudget: 550000,
    bannerHeadline: '',
    bannerDatesText: '',
  });

  // Sync state when modal opens or entity/event changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setFormData({
        name: currentEntity.name || 'श्री श्री 108 दुर्गा पूजा समिति',
        location: currentEntity.location || 'मुख्य चौक, नारायणपुर',
        registrationNo: currentEntity.registrationNo || '',
        upiId: currentEntity.upiId || 'durgapuja.narayanpur@upi',
        tagline: currentEntity.tagline || 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।',
        title: currentEvent.title || 'श्री दुर्गा पूजा महोत्सव 2026',
        fiscalYear: currentEvent.fiscalYear || '41वाँ वार्षिकोत्सव',
        targetBudget: currentEvent.targetBudget || 550000,
        bannerHeadline: currentEntity.bannerHeadline || 'माँ भगवती कृपा एवं चंदा-व्यय डिजिटल प्रबंधन प्रणाली',
        bannerDatesText: currentEntity.bannerDatesText || 'शारदीय नवरात्र: 15 अक्टूबर से 24 अक्टूबर 2026',
      });
    }
  }, [isOpen, defaultTab, currentEntity, currentEvent]);

  // Confirmation Alert State for Data Reset
  const [resetConfirmMode, setResetConfirmMode] = useState<'wipe_clean' | 'restore_defaults' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Handle Save Header Texts
  const handleSaveHeaderTexts = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('कृपया समिति का नाम दर्ज करें!');
      return;
    }

    // 1. Update Entity
    updateEntity(currentEntity.id, {
      name: formData.name.trim(),
      location: formData.location.trim(),
      registrationNo: formData.registrationNo.trim() || undefined,
      upiId: formData.upiId.trim() || undefined,
      tagline: formData.tagline.trim(),
      bannerHeadline: formData.bannerHeadline.trim() || undefined,
      bannerDatesText: formData.bannerDatesText.trim() || undefined,
    });

    // 2. Update Event
    updateEvent(currentEvent.id, {
      title: formData.title.trim() || 'श्री दुर्गा पूजा महोत्सव',
      fiscalYear: formData.fiscalYear.trim() || 'वार्षिकोत्सव 2026',
      targetBudget: Number(formData.targetBudget) || 0,
    });

    toast.success('समिति शीर्षक व बैनर विवरण सफलतापूर्वक सहेजा गया!');
    onClose();
  };

  // Handle Execute Reset
  const handleExecuteReset = async () => {
    if (!resetConfirmMode) return;
    setIsResetting(true);
    try {
      await resetDurgaPujaUnitData(resetConfirmMode);
      setResetConfirmMode(null);
      onClose();
    } catch (err: any) {
      toast.error('डेटा रीसेट करने में त्रुटि: ' + (err.message || 'अज्ञात त्रुटि'));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-0 bg-white border border-amber-300/80 shadow-2xl">
          {/* Festive Sacred Header */}
          <div className="bg-gradient-to-r from-rose-950 via-amber-950 to-slate-950 text-white p-5 sm:p-6 rounded-t-3xl relative overflow-hidden border-b border-amber-500/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
            
            <DialogHeader className="relative z-10 text-left">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 inline-flex">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </span>
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                  यूनिट सेटिंग्स एवं संपादन
                </Badge>
              </div>

              <DialogTitle className="text-xl sm:text-2xl font-black text-white font-serif mt-2 tracking-wide flex items-center gap-2">
                <span>दुर्गा पूजा प्रबंधन सेटिंग्स</span>
              </DialogTitle>

              <DialogDescription className="text-amber-200/80 text-xs sm:text-sm font-serif">
                समिति का नाम, स्थल, बैनर शीर्षक, तिथियाँ, UPI QR एवं डेटा रीसेट प्रबंधन
              </DialogDescription>
            </DialogHeader>

            {/* Segmented Tab Buttons */}
            <div className="mt-5 flex rounded-2xl bg-white/10 p-1 border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTab('header')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'header'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>शीर्षक व बैनर संपादन</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reset')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'reset'
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md font-black'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>डेटा रीसेट व प्रबंधन</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6">
            {/* TAB 1: HEADER & BANNER TEXTS */}
            {activeTab === 'header' && (
              <form onSubmit={handleSaveHeaderTexts} className="space-y-4">
                {/* Live Preview Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-amber-950/90 to-slate-950/90 text-white border border-amber-400/40 shadow-inner space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      लाइव पूर्वावलोकन (Live Preview)
                    </span>
                    <span className="text-[10px] text-white/60">
                      📍 {formData.location || 'स्थल'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-amber-100 font-serif truncate">
                    {formData.name || 'समिति का नाम'}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {formData.title} • {formData.fiscalYear}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                      {formData.bannerDatesText}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Samiti Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      समिति का पूरा नाम (Samiti Name) *
                    </Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="उदा: श्री श्री 108 दुर्गा पूजा समिति"
                      className="rounded-xl border-amber-200 focus:border-amber-500 text-sm font-semibold"
                    />
                  </div>

                  {/* Pandal Location */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      पंडाल / पूजा स्थल (Location)
                    </Label>
                    <Input
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="उदा: मुख्य चौक, नारायणपुर"
                      className="rounded-xl border-amber-200 text-sm"
                    />
                  </div>

                  {/* Event Title */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      महोत्सव का शीर्षक (Festival Title)
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="उदा: श्री दुर्गा पूजा महोत्सव 2026"
                      className="rounded-xl border-amber-200 text-sm font-semibold"
                    />
                  </div>

                  {/* Edition / Fiscal Year */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      वार्षिकोत्सव / सत्र (Edition / Year)
                    </Label>
                    <Input
                      value={formData.fiscalYear}
                      onChange={e => setFormData({ ...formData, fiscalYear: e.target.value })}
                      placeholder="उदा: 41वाँ वार्षिकोत्सव"
                      className="rounded-xl border-amber-200 text-sm"
                    />
                  </div>

                  {/* Festival Dates */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      नवरात्र / पूजा तिथियाँ (Festival Dates)
                    </Label>
                    <Input
                      value={formData.bannerDatesText}
                      onChange={e => setFormData({ ...formData, bannerDatesText: e.target.value })}
                      placeholder="उदा: शारदीय नवरात्र: 15 अक्टूबर से 24 अक्टूबर 2026"
                      className="rounded-xl border-amber-200 text-sm"
                    />
                  </div>

                  {/* Main Banner Headline */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      मुख्य बैनर हेडिंग (Banner Headline)
                    </Label>
                    <Input
                      value={formData.bannerHeadline}
                      onChange={e => setFormData({ ...formData, bannerHeadline: e.target.value })}
                      placeholder="उदा: माँ भगवती कृपा एवं चंदा-व्यय डिजिटल प्रबंधन प्रणाली"
                      className="rounded-xl border-amber-200 text-sm font-medium"
                    />
                  </div>

                  {/* Tagline / Blessing */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      आशीर्वाद संदेश / टैगलाइन (Blessing / Tagline)
                    </Label>
                    <Textarea
                      rows={2}
                      value={formData.tagline}
                      onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="उदा: माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।"
                      className="rounded-xl border-amber-200 text-xs sm:text-sm font-serif italic"
                    />
                  </div>

                  {/* UPI ID */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      समिति UPI ID (QR चंदा हेतु)
                    </Label>
                    <Input
                      value={formData.upiId}
                      onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                      placeholder="उदा: durgapuja.narayanpur@upi"
                      className="rounded-xl border-amber-200 text-xs font-mono"
                    />
                  </div>

                  {/* Target Budget */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-amber-600 font-bold">₹</span>
                      संकलन लक्ष्य बजट (Target Budget ₹)
                    </Label>
                    <Input
                      type="number"
                      value={formData.targetBudget}
                      onChange={e => setFormData({ ...formData, targetBudget: Number(e.target.value) })}
                      placeholder="550000"
                      className="rounded-xl border-amber-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="rounded-xl text-xs h-9"
                  >
                    रद्द करें
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs h-9 shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>परिवर्तन सुरक्षित करें (Save)</span>
                  </Button>
                </div>
              </form>
            )}

            {/* TAB 2: DATA RESET & MANAGEMENT */}
            {activeTab === 'reset' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>डेटा प्रबंधन एवं सुरक्षा क्षेत्र (Data Maintenance Zone)</span>
                  </div>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    यह विकल्प केवल समिति के अधिकृत एडमिन एवं कोषाध्यक्ष के लिए है। यहाँ से आप चंदा व खर्च डेटा को आवश्यकतानुसार रीसेट या शून्य कर सकते हैं।
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Option 1: Clean Slate */}
                  <div className="p-4 rounded-2xl border-2 border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-all space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-rose-950">
                            1. शून्य रिकॉर्ड (Clean Slate - ₹0)
                          </h4>
                          <p className="text-xs text-rose-800/80">
                            नए वित्तीय वर्ष या वास्तविक चंदा संग्रह के लिए एकदम खाली बहीखाता।
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-rose-200 text-rose-900 border-none font-bold text-[10px] shrink-0">
                        अनुशंसित
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      सभी मौजूदा डेमो चंदा प्रविष्टियाँ और खर्च वाउचर हटा दिए जाएंगे। नई प्रविष्टियाँ 1 से प्रारंभ होंगी।
                    </p>

                    <Button
                      type="button"
                      onClick={() => setResetConfirmMode('wipe_clean')}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>सभी चंदा व खर्च रिकॉर्ड शून्य करें (₹0 Clean Slate)</span>
                    </Button>
                  </div>

                  {/* Option 2: Restore Sample Defaults */}
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition-all space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-950">
                          2. डिफ़ॉल्ट डेमो डेटा रीस्टोर करें (Restore Sample Data)
                        </h4>
                        <p className="text-xs text-amber-800/80">
                          प्रस्तुति, परीक्षण एवं प्रशिक्षण हेतु नमूना डेटा पुनः लोड करें।
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      मूल 8 नमूना चंदा प्रविष्टियाँ (दुकानदार, ग्रामीण, नौकरीपेशा) एवं 5 पंडाल/पूजा खर्च वाउचर लोड हो जाएंगे।
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResetConfirmMode('restore_defaults')}
                      className="w-full border-amber-300 hover:bg-amber-100/60 text-amber-950 font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>नमूना डेमो डेटा लोड करें (Restore Demo Data)</span>
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="rounded-xl text-xs h-9"
                  >
                    बंद करें
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog for Safety */}
      <AlertDialog open={!!resetConfirmMode} onOpenChange={open => !open && setResetConfirmMode(null)}>
        <AlertDialogContent className="rounded-2xl w-[94vw] max-w-md bg-white border border-amber-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-slate-900 text-base sm:text-lg font-serif">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                {resetConfirmMode === 'wipe_clean'
                  ? 'पुष्टि करें: सभी रिकॉर्ड शून्य करें?'
                  : 'पुष्टि करें: डेमो डेटा रीस्टोर करें?'}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-xs sm:text-sm pt-2">
              {resetConfirmMode === 'wipe_clean' ? (
                <span className="space-y-1 block">
                  <strong className="text-rose-700 block font-bold">
                    चेतावनी: यह कार्यवाही सभी वर्तमान चंदा और खर्च प्रविष्टियों को हटा देगी!
                  </strong>
                  बहीखाता एकदम साफ (₹0) हो जाएगा। क्या आप सचमुच आगे बढ़ना चाहते हैं?
                </span>
              ) : (
                <span>
                  वर्तमान चंदा और खर्च डेटा को हटाकर मूल 8 नमूना चंदा और 5 खर्चे वाउचर लोड कर दिए जाएंगे। क्या आप आगे बढ़ना चाहते हैं?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isResetting} className="text-xs rounded-xl">
              रद्द करें
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isResetting}
              onClick={handleExecuteReset}
              className={`text-xs rounded-xl font-bold ${
                resetConfirmMode === 'wipe_clean'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {isResetting ? 'प्रक्रिया जारी...' : 'हाँ, पुष्टि करें'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
