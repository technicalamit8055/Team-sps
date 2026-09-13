import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, QrCode, RefreshCw, Smartphone, Unlink, AlertTriangle, ServerCrash } from 'lucide-react';
import { toast } from 'sonner';
import {
  connectWhatsApp,
  getWhatsAppStatus,
  isWhatsAppConfigured,
  logoutWhatsApp,
  WhatsAppError,
  type WhatsAppStatus,
} from '@/lib/whatsapp';

/** How often to re-check while a QR is on screen / a connection is settling. */
const ACTIVE_POLL_MS = 3000;
const IDLE_POLL_MS = 15000;

const STATE_META: Record<
  WhatsAppStatus['state'],
  { label: string; className: string }
> = {
  open: { label: 'जुड़ा हुआ (Connected)', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  qr: { label: 'QR स्कैन करें', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  connecting: { label: 'जुड़ रहा है…', className: 'bg-sky-100 text-sky-800 border-sky-300' },
  closed: { label: 'बंद (Not linked)', className: 'bg-slate-100 text-slate-700 border-slate-300' },
};

export const WhatsAppConnectionCard: React.FC<{ className?: string }> = ({ className }) => {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [serverDown, setServerDown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getWhatsAppStatus();
      if (!mountedRef.current) return next;
      setStatus(next);
      setFetchError(null);
      setServerDown(false);
      return next;
    } catch (err) {
      if (mountedRef.current) {
        setFetchError((err as Error).message);
        setServerDown((err as WhatsAppError).code === 'SERVER_UNREACHABLE');
      }
      return null;
    }
  }, []);

  // Poll faster while pairing is in progress, slower once it settles.
  useEffect(() => {
    mountedRef.current = true;

    const tick = async () => {
      const next = await refresh();
      if (!mountedRef.current) return;
      const active = next?.state === 'qr' || next?.state === 'connecting';
      timerRef.current = setTimeout(tick, active ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    };
    tick();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refresh]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const next = await connectWhatsApp();
      setStatus(next);
      setFetchError(null);
      setServerDown(false);
      toast.success(
        next.state === 'open'
          ? 'WhatsApp पहले से जुड़ा है!'
          : 'QR तैयार है — फ़ोन से स्कैन करें।',
      );
    } catch (err) {
      setServerDown((err as WhatsAppError).code === 'SERVER_UNREACHABLE');
      setFetchError((err as Error).message);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      setStatus(await logoutWhatsApp());
      toast.success('WhatsApp अनलिंक हो गया।');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const state = status?.state ?? 'closed';
  const meta = STATE_META[state];
  const connected = Boolean(status?.connected);

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm ${className || ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Smartphone className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">WhatsApp रसीद सेवा</h3>
            <p className="text-[13px] text-slate-500">
              रसीदें सीधे WhatsApp पर भेजें (बिना किसी पेड API के)
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[12px] font-semibold shrink-0 ${meta.className}`}>
          {meta.label}
        </Badge>
      </div>

      {/* No server reachable — the most common reason no QR appears. The
          remedy differs by environment, so don't show dev advice in prod. */}
      {serverDown && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <div className="flex items-start gap-2">
            <ServerCrash className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              {isWhatsAppConfigured ? (
                <>
                  <p className="text-xs font-bold text-rose-900">
                    WhatsApp सर्वर नहीं चल रहा है
                  </p>
                  <p className="text-[13px] text-rose-800 leading-relaxed mt-0.5">
                    QR बनाने के लिए बैकग्राउंड सर्वर ज़रूरी है। टर्मिनल में यह चलाएँ:
                  </p>
                  <code className="mt-1.5 block text-[13px] font-mono bg-white border border-rose-200 rounded-lg px-2 py-1 text-rose-900">
                    npm run dev:all
                  </code>
                  <p className="text-[12px] text-rose-700/80 mt-1.5 leading-relaxed">
                    पहले से <code className="font-mono">npm run dev</code> चल रहा हो तो उसे बंद
                    करके यह चलाएँ, या अलग टर्मिनल में{' '}
                    <code className="font-mono">npm run server</code> चलाएँ।
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-rose-900">
                    WhatsApp सर्वर कॉन्फ़िगर नहीं है
                  </p>
                  <p className="text-[13px] text-rose-800 leading-relaxed mt-0.5">
                    WhatsApp को एक हमेशा चलने वाले सर्वर की ज़रूरत है, जो Vercel पर नहीं चल
                    सकता। उसे Railway/Render पर डिप्लॉय करें, फिर Vercel में{' '}
                    <code className="font-mono">VITE_WHATSAPP_API_URL</code> सेट करके दोबारा
                    डिप्लॉय करें।
                  </p>
                  <p className="text-[12px] text-rose-700/80 mt-1.5 leading-relaxed">
                    पूरी जानकारी: <code className="font-mono">docs/WHATSAPP_RECEIPTS.md</code>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Any other client-side fetch failure */}
      {!serverDown && fetchError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-[13px] text-rose-800 leading-relaxed">{fetchError}</p>
        </div>
      )}

      {/* Last connection error reported by the socket */}
      {!serverDown && !fetchError && status?.error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[13px] text-amber-900 leading-relaxed">{status.error}</p>
        </div>
      )}

      {/* Connected identity */}
      {connected && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[13px] text-emerald-700">लिंक्ड डिवाइस:</p>
          <p className="text-xs font-bold text-emerald-900 font-mono break-all">
            {status?.user?.name || status?.user?.id?.split(':')[0] || 'WhatsApp खाता'}
          </p>
        </div>
      )}

      {/* Pairing QR */}
      {!connected && status?.qr && (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <img
            src={status.qr}
            alt="WhatsApp pairing QR code"
            className="w-44 h-44 sm:w-52 sm:h-52 rounded-lg bg-white p-1.5 border border-amber-200"
          />
          <p className="text-[13px] text-amber-900 text-center leading-relaxed max-w-xs">
            WhatsApp खोलें → <strong>Settings</strong> → <strong>Linked Devices</strong> →{' '}
            <strong>Link a device</strong> → यह QR स्कैन करें
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
        {connected ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-9 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 w-full sm:w-auto"
              >
                <Unlink className="w-3.5 h-3.5 mr-1.5" />
                अनलिंक करें
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>WhatsApp अनलिंक करें?</AlertDialogTitle>
                <AlertDialogDescription>
                  यह डिवाइस WhatsApp से हट जाएगा और सेव किया गया सेशन मिट जाएगा। दोबारा भेजने के लिए
                  फिर से QR स्कैन करना होगा।
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>रद्द करें</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  हाँ, अनलिंक करें
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={loading}
            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <QrCode className="w-3.5 h-3.5 mr-1.5" />
            )}
            {status?.qr ? 'QR रिफ्रेश करें' : 'WhatsApp जोड़ें'}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refresh()}
          disabled={loading}
          className="h-9 text-xs text-slate-600 w-full sm:w-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          स्थिति जाँचें
        </Button>
      </div>
    </div>
  );
};
