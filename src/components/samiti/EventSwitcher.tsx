import React, { useState } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Calendar, Plus, Sparkles, QrCode, CheckCircle2, RefreshCw } from 'lucide-react';

export const EventSwitcher: React.FC = () => {
  const {
    entities,
    currentEntity,
    setCurrentEntityId,
    events,
    currentEvent,
    setCurrentEventId,
    addEntity,
    resetToSampleData,
  } = useSamiti();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'festival_samiti' | 'business' | 'rwa' | 'ngo'>('festival_samiti');
  const [upiId, setUpiId] = useState('');
  const [tagline, setTagline] = useState('');
  const [location, setLocation] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [targetBudget, setTargetBudget] = useState('300000');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventTitle.trim()) return;

    addEntity(
      {
        name: name.trim(),
        type,
        upiId: upiId.trim() || 'samiti@upi',
        tagline: tagline.trim() || 'सर्वजन हिताय, सर्वजन सुखाय',
        location: location.trim() || 'मुख्य बाजार',
        establishedYear: new Date().getFullYear(),
      },
      {
        title: eventTitle.trim(),
        fiscalYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
        targetBudget: parseFloat(targetBudget) || 0,
        isActive: true,
      }
    );

    setName('');
    setEventTitle('');
    setUpiId('');
    setTagline('');
    setLocation('');
    setIsOpen(false);
  };

  const getEntityBadge = (t: string) => {
    switch (t) {
      case 'festival_samiti':
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-300">उत्सव / पूजा समिति</Badge>;
      case 'election':
        return <Badge className="bg-red-500/10 text-red-700 border-red-300 font-bold">🗳️ चुनाव अभियान</Badge>;
      case 'business':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-300">व्यापार / व्यवसाय</Badge>;
      case 'rwa':
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300">सोसायटी / RWA</Badge>;
      default:
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-300">सामाजिक संस्था</Badge>;
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Entity & Event Selector */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900/60">
                मास्टर कंट्रोल • समिति / व्यवसाय चयन
              </span>
              {getEntityBadge(currentEntity.type)}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Select value={currentEntity.id} onValueChange={setCurrentEntityId}>
                <SelectTrigger className="w-[280px] sm:w-[320px] bg-white/90 border-amber-300 font-bold text-amber-950 shadow-sm text-sm">
                  <SelectValue placeholder="समिति चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map(ent => (
                    <SelectItem key={ent.id} value={ent.id} className="cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{ent.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {events.length > 1 && (
                <Select value={currentEvent.id} onValueChange={setCurrentEventId}>
                  <SelectTrigger className="w-[220px] bg-white/90 border-amber-300 text-xs font-medium text-amber-900">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    <SelectValue placeholder="सत्र / उत्सव" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(ev => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <p className="text-xs text-amber-800/80 mt-1 flex items-center gap-2">
              <span>📍 {currentEntity.location || 'मुख्य स्थल'}</span>
              <span>•</span>
              <span className="font-mono bg-amber-200/50 px-1.5 py-0.5 rounded text-[11px]">
                UPI: {currentEntity.upiId || 'not-set'}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToSampleData}
            title="प्रारंभिक नारायणपुर पूजा समिति डेटा लोड करें"
            className="text-xs border-amber-300 text-amber-800 hover:bg-amber-100/80"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            सैंपल डेटा रीसेट
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-md shadow-orange-500/20 text-xs font-semibold">
                <Plus className="w-4 h-4 mr-1.5" />
                + नया उत्सव / व्यवसाय जोड़ें
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-950">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  नया संगठन / समिति या व्यवसाय बनाएँ
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <Label className="text-xs font-semibold">संगठन / समिति का नाम *</Label>
                  <Input
                    placeholder="उदा० श्री छठ पूजा सेवा समिति, नारायणपुर"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">प्रकार</Label>
                    <Select value={type} onValueChange={(val: any) => setType(val)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="festival_samiti">उत्सव / पूजा समिति</SelectItem>
                        <SelectItem value="election">🗳️ चुनाव अभियान (Election)</SelectItem>
                        <SelectItem value="business">व्यापार / व्यवसाय</SelectItem>
                        <SelectItem value="rwa">सोसायटी / RWA</SelectItem>
                        <SelectItem value="ngo">NGO / सामाजिक संस्था</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">UPI ID (चंदा / भुगतान हेतु)</Label>
                    <Input
                      placeholder="samiti@oksbi"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">प्रथम उत्सव / इवेंट का शीर्षक *</Label>
                  <Input
                    placeholder="उदा० छठ महापर्व 2026 या वार्षिक व्यापार उत्सव"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">अनुमानित बजट लक्ष्य (₹)</Label>
                    <Input
                      type="number"
                      placeholder="300000"
                      value={targetBudget}
                      onChange={e => setTargetBudget(e.target.value)}
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">स्थान / स्थल</Label>
                    <Input
                      placeholder="सूर्य मंदिर घाट / बाजार"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">आशीर्वचन / स्लोगन (रसीद पर छपने हेतु)</Label>
                  <Input
                    placeholder="छठी मईया की जय! सर्वजन सुखाय"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                    रद्द करें
                  </Button>
                  <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    समिति तैयार करें
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};
