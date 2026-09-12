import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Loader2,
  ShieldCheck,
  Timer,
  Globe,
  FolderLock,
  Server,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppConnectionCard } from '@/components/samiti/WhatsAppConnectionCard';
import {
  getWhatsAppSettings,
  sendWhatsAppTest,
  type WhatsAppSettings,
} from '@/lib/whatsapp';

/** One row of read-only server configuration. */
const ConfigRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}> = ({ icon, label, value, hint }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-xs font-semibold text-slate-900 font-mono break-all">{value}</p>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  </div>
);

export const IntegrationsView: React.FC = () => {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setSettings(await getWhatsAppSettings());
      setSettingsError(null);
    } catch (err) {
      setSettingsError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await sendWhatsAppTest(testPhone.trim() || undefined);
      toast.success(`परीक्षण संदेश भेजा गया → ${res.jid.split('@')[0]}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section heading */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            WhatsApp इंटीग्रेशन
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            WhatsApp Web की तरह QR स्कैन करके जोड़ें — फिर सभी यूनिट से रसीदें सीधे भेजी जा सकेंगी
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          बिना किसी पेड API के
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 items-start">
        {/* Connection / pairing */}
        <WhatsAppConnectionCard />

        <div className="space-y-5">
          {/* Server configuration (read-only) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-500" />
              सर्वर कॉन्फ़िगरेशन
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              यह मान <code className="font-mono">.env</code> से आते हैं — बदलने के बाद सर्वर
              पुनः चालू करें
            </p>

            {settingsError ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5">
                <p className="text-[11px] text-rose-800 leading-relaxed">{settingsError}</p>
              </div>
            ) : !settings ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                लोड हो रहा है…
              </div>
            ) : (
              <div className="mt-2">
                <ConfigRow
                  icon={<Globe className="w-3.5 h-3.5 text-sky-600" />}
                  label="डिफ़ॉल्ट देश कोड"
                  value={`+${settings.countryCode}`}
                  hint="10 अंक या कम वाले नंबरों में स्वतः जुड़ता है"
                />
                <ConfigRow
                  icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                  label="डिफ़ॉल्ट प्राप्तकर्ता"
                  value={settings.defaultPhone || '— (सेट नहीं)'}
                  hint="जब किसी रसीद में नंबर न हो तब उपयोग होता है"
                />
                <ConfigRow
                  icon={<ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                  label="व्यवसाय / समिति नाम"
                  value={settings.businessName}
                />
                <ConfigRow
                  icon={<Timer className="w-3.5 h-3.5 text-rose-600" />}
                  label="संदेशों के बीच न्यूनतम अंतराल"
                  value={`${settings.minGapMs} ms`}
                  hint="बैन से बचाव — संदेश क्रम में भेजे जाते हैं"
                />
                <ConfigRow
                  icon={<FolderLock className="w-3.5 h-3.5 text-purple-600" />}
                  label="सेशन फ़ोल्डर"
                  value={settings.authDir}
                  hint="इसे कभी साझा या कमिट न करें"
                />
                <ConfigRow
                  icon={
                    settings.tokenRequired ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-amber-600" />
                    )
                  }
                  label="API टोकन सुरक्षा"
                  value={settings.tokenRequired ? 'सक्रिय' : 'निष्क्रिय'}
                  hint={
                    settings.tokenRequired
                      ? undefined
                      : 'सार्वजनिक सर्वर पर WHATSAPP_API_TOKEN ज़रूर सेट करें'
                  }
                />
              </div>
            )}
          </div>

          {/* Test send */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              परीक्षण संदेश भेजें
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              कनेक्शन जाँचने के लिए अपने ही नंबर पर एक संदेश भेजें
            </p>

            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label htmlFor="wa-test-phone" className="sr-only">
                  परीक्षण नंबर
                </Label>
                <Input
                  id="wa-test-phone"
                  placeholder={settings?.defaultPhone || 'उदा० 9835012345'}
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  className="font-mono text-xs h-9"
                />
              </div>
              <Button
                size="sm"
                onClick={handleTest}
                disabled={testing}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                {testing ? 'भेजा जा रहा है…' : 'परीक्षण भेजें'}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              खाली छोड़ने पर डिफ़ॉल्ट प्राप्तकर्ता को भेजा जाएगा।
            </p>
          </div>
        </div>
      </div>

      {/* Setup help */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-amber-950">सेटअप कैसे करें</h3>
        <ol className="mt-2 space-y-1.5 text-xs text-amber-900 list-decimal list-inside leading-relaxed">
          <li>
            सर्वर चालू करें — टर्मिनल में <code className="font-mono bg-white/70 px-1 rounded">npm run dev:all</code>
          </li>
          <li>ऊपर <strong>WhatsApp जोड़ें</strong> दबाएँ और QR कोड आने तक रुकें</li>
          <li>
            फ़ोन में WhatsApp → <strong>Settings</strong> → <strong>Linked Devices</strong> →{' '}
            <strong>Link a device</strong> → QR स्कैन करें
          </li>
          <li>परीक्षण संदेश भेजकर पुष्टि करें — इसके बाद हर यूनिट से रसीद भेजी जा सकेगी</li>
        </ol>
        <p className="text-[11px] text-amber-800 mt-2.5">
          सेशन सुरक्षित रहता है — सर्वर दोबारा चालू करने पर स्वतः जुड़ जाएगा, बार-बार QR स्कैन
          करने की ज़रूरत नहीं।
        </p>
      </div>
    </div>
  );
};
