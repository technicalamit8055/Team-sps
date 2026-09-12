import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Download, Share2, PlusSquare, Smartphone, CheckCircle2, Shield } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'master' | 'default' | 'compact';
  label?: string;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'default',
  label,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  // If already installed, show small indicator or return null based on context
  if (isInstalled) {
    if (variant === 'master') {
      return (
        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl"
          title="Team SPS PWA is installed and running in app mode"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>App Active</span>
        </span>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setIsIOSModalOpen(true);
      return;
    }

    if (isInstallable) {
      await promptInstall();
    } else {
      // Fallback instruction for browsers that hide install button or have standard browser menu
      setIsIOSModalOpen(true);
    }
  };

  const defaultLabel =
    label ||
    (variant === 'master' ? 'Install Master OS' : 'Install App');

  return (
    <>
      <Button
        size="sm"
        onClick={handleInstallClick}
        className={`h-8 px-2.5 sm:px-3 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
          variant === 'master'
            ? 'bg-navy/90 hover:bg-navy text-white border border-navy/30'
            : 'btn-saffron text-white'
        } ${className}`}
        title="Install Team SPS as a standalone application on your device"
      >
        {variant === 'master' ? (
          <Shield className="w-3.5 h-3.5 text-saffron" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span className="hidden xs:inline">{defaultLabel}</span>
      </Button>

      {/* iOS & Manual Installation Guide Modal */}
      <Dialog open={isIOSModalOpen} onOpenChange={setIsIOSModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center text-navy mb-2">
              <Smartphone className="w-6 h-6 text-navy" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              ऐप को होम स्क्रीन पर इंस्टॉल करें
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              बिना ऐप स्टोर के सीधे अपने फोन या कंप्यूटर पर इंस्टॉल करें।
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3 text-xs text-slate-700">
            {isIOS ? (
              <>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-white text-[11px] font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      सफ़ारी मेन्यू में <Share2 className="w-3.5 h-3.5 text-navy" /> (Share) बटन दबाएं
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      सफ़ारी ब्राउज़र के नीचे स्थित शेयर आइकन पर टैप करें।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-white text-[11px] font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <PlusSquare className="w-3.5 h-3.5 text-navy" /> 'Add to Home Screen' चुनें
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      नीचे स्क्रॉल करें और 'होम स्क्रीन में जोड़ें' पर क्लिक करें।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-white text-[11px] font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">ऊपर दायें 'Add' पर क्लिक करें</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ऐप आपके होम स्क्रीन पर सीधे एक नेटिव ऐप की तरह आ जाएगा।
                    </p>
                  </div>
                </div>
              </>
            ) : isAndroid ? (
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <p className="font-medium text-slate-800">Chrome मेन्यू से इंस्टॉल करें:</p>
                <p>1. ऊपर दायीं ओर ब्राउज़र मेन्यू (तीन बिंदु <strong>⋮</strong>) पर टैप करें।</p>
                <p>2. <strong>'Add to Home screen'</strong> या <strong>'Install app'</strong> चुनें।</p>
                <p>3. <strong>'Install'</strong> पर टैप करें — ऐप होम स्क्रीन पर आ जाएगा।</p>
                <p className="text-[11px] text-slate-500 pt-1">
                  नोट: यह विकल्प Chrome में ही उपलब्ध है। यदि आप किसी अन्य ब्राउज़र या
                  इन-ऐप ब्राउज़र (WhatsApp, Instagram) से खोल रहे हैं, तो पहले Chrome में खोलें।
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <p className="font-medium text-slate-800">ब्राउज़र मेन्यू से इंस्टॉल करें:</p>
                <p>1. ब्राउज़र के शीर्ष पर <strong>'Install App'</strong> आइकन पर क्लिक करें।</p>
                <p>2. या ब्राउज़र मेन्यू (तीन बिंदु ⋮) खोलकर <strong>'Install Team SPS'</strong> चुनें।</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => setIsIOSModalOpen(false)}
              className="btn-saffron w-full text-xs font-bold"
            >
              समझ गया (Got It)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
