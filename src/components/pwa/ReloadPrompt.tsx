import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-navy/20 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy">
          {offlineReady ? (
            <Check className="h-5 w-5 text-emerald-600" />
          ) : (
            <RefreshCw className="h-5 w-5 text-saffron animate-spin" />
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-bold text-slate-900">
            {offlineReady ? 'ऐप ऑफ़लाइन उपयोग के लिए तैयार है' : 'नया संस्करण उपलब्ध है!'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {offlineReady
              ? 'अब आप बिना इंटरनेट के भी इसे खोल सकते हैं।'
              : 'नवीनतम अपडेट लागू करने के लिए रीलोड करें।'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {needRefresh && (
              <Button
                size="sm"
                onClick={() => updateServiceWorker(true)}
                className="btn-saffron h-7 px-3 text-xs font-bold"
              >
                अपडेट करें (Reload)
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={close}
              className="h-7 px-2.5 text-xs text-slate-500 hover:text-slate-800"
            >
              बंद करें
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
