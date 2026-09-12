import React, { useRef } from 'react';
import { useVictory } from '@/contexts/VictoryContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, RotateCcw, Save, AlertTriangle, FileSpreadsheet, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
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
} from "@/components/ui/alert-dialog";
import { LinktreeAdmin } from '@/components/LinktreeAdmin';
import { CSVImporter } from '@/components/CSVImporter';
import { WhatsAppConnectionCard } from '@/components/samiti/WhatsAppConnectionCard';

export const Settings: React.FC = () => {
  const { data, updateSettings, exportDataFile, importDataFile, factoryReset } = useVictory();
  const { role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = role === 'admin';

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importDataFile(file);
        toast.success('डेटा रिस्टोर हो गया!');
      } catch (error) {
        toast.error('फाइल पढ़ने में त्रुटि');
      }
    }
  };

  const handleSettingChange = (key: keyof typeof data.settings, value: string | number) => {
    updateSettings({ [key]: value });
    toast.success('सेटिंग सेव हो गई');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">सेटिंग्स</h1>
        <p className="text-muted-foreground">कंट्रोल सेंटर</p>
      </div>

      {/* Data Management */}
      <div className="glass-panel p-5">
        <h2 className="text-lg font-semibold mb-4">डेटा प्रबंधन</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Button variant="outline" onClick={exportDataFile} className="justify-start">
            <Download className="w-4 h-4 mr-2" />
            बैकअप डाउनलोड करें
          </Button>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full justify-start"
            >
              <Upload className="w-4 h-4 mr-2" />
              बैकअप रिस्टोर करें
            </Button>
          </div>
        </div>
      </div>

      {/* CSV Voter Importer - Admin Only */}
      {isAdmin && (
        <>
          <Separator />
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-victory-saffron" />
              वोटर डेटा इम्पोर्ट
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              CSV फाइल से वोटर डेटा अपलोड करें (Narayanpur Panchayat फॉर्मेट)
            </p>
            <CSVImporter />
          </div>
          <Separator />
        </>
      )}

      {/* WhatsApp receipt sender - Admin Only */}
      {isAdmin && (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              व्हाट्सएप रसीद कनेक्शन
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              एक बार QR स्कैन करें — फिर रसीदें सीधे व्हाट्सएप पर भेजी जा सकेंगी
            </p>
            <WhatsAppConnectionCard />
          </div>
          <Separator />
        </>
      )}

      {/* Linktree Admin - Only for Admins */}
      {isAdmin && (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-2">लिंकट्री प्रबंधन</h2>
            <p className="text-muted-foreground text-sm mb-4">
              पब्लिक लैंडिंग पेज की प्रोफाइल और लिंक्स एडिट करें
            </p>
            <LinktreeAdmin />
          </div>
          <Separator />
        </>
      )}

      {/* Campaign Settings */}
      <div className="glass-panel p-5">
        <h2 className="text-lg font-semibold mb-4">अभियान सेटिंग्स</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="candidateName">उम्मीदवार का नाम</Label>
            <Input
              id="candidateName"
              value={data.settings.candidateName}
              onChange={(e) => handleSettingChange('candidateName', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="constituency">निर्वाचन क्षेत्र</Label>
            <Input
              id="constituency"
              value={data.settings.constituency}
              onChange={(e) => handleSettingChange('constituency', e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalVoters">कुल मतदाता</Label>
              <Input
                id="totalVoters"
                type="number"
                value={data.settings.totalVoters}
                onChange={(e) => handleSettingChange('totalVoters', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="winningGoal">जीत का लक्ष्य</Label>
              <Input
                id="winningGoal"
                type="number"
                value={data.settings.winningGoal}
                onChange={(e) => handleSettingChange('winningGoal', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="daysLeft">शेष दिन</Label>
              <Input
                id="daysLeft"
                type="number"
                value={data.settings.daysLeft}
                onChange={(e) => handleSettingChange('daysLeft', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="electionDate">चुनाव तिथि</Label>
              <Input
                id="electionDate"
                type="date"
                value={data.settings.electionDate}
                onChange={(e) => handleSettingChange('electionDate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>


      {/* Statistics */}
      <div className="glass-panel p-5">
        <h2 className="text-lg font-semibold mb-4">डेटा सांख्यिकी</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{data.voters.length}</p>
            <p className="text-xs text-muted-foreground">मतदाता</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{data.expenses.length}</p>
            <p className="text-xs text-muted-foreground">खर्च रिकॉर्ड</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{data.tasks.length}</p>
            <p className="text-xs text-muted-foreground">कार्य</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{data.events.length}</p>
            <p className="text-xs text-muted-foreground">कार्यक्रम</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel p-5 border-red-200 bg-red-50/50">
        <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          खतरा क्षेत्र
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          यह सभी डेटा मिटा देगा। इसे पुनः प्राप्त नहीं किया जा सकता।
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <RotateCcw className="w-4 h-4 mr-2" />
              फैक्ट्री रीसेट
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>क्या आप सुनिश्चित हैं?</AlertDialogTitle>
              <AlertDialogDescription>
                यह क्रिया सभी डेटा को स्थायी रूप से हटा देगी। कृपया पहले बैकअप लें।
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>रद्द करें</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  factoryReset();
                  toast.success('सभी डेटा रीसेट हो गया');
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                हां, रीसेट करें
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Version */}
      <div className="text-center text-sm text-muted-foreground pb-8">
        Victory OS v26 • Made with ❤️ for Indian Elections
      </div>
    </div>
  );
};
