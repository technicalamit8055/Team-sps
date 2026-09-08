/**
 * VoterProfileSheet - Detailed voter profile in a slide-over sheet
 * Displays comprehensive voter information with L/D status badge
 */
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Phone,
  MessageCircle,
  MapPin,
  User,
  Users,
  Calendar,
  Hash,
  Vote,
  Heart,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Minus,
} from 'lucide-react';
import type { CRMVoter } from '@/hooks/useVoterCRM';

interface VoterProfileSheetProps {
  voter: CRMVoter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: 'support' | 'oppose' | 'neutral') => void;
  onMarkVoted: () => void;
  candidateName: string;
  pollingMode: boolean;
}

export const VoterProfileSheet: React.FC<VoterProfileSheetProps> = ({
  voter,
  open,
  onOpenChange,
  onStatusChange,
  onMarkVoted,
  candidateName,
  pollingMode,
}) => {
  if (!voter) return null;

  const isAlive = voter.is_alive !== false;

  const statusConfig = {
    support: {
      icon: CheckCircle2,
      label: 'समर्थक',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
      buttonClass: 'bg-emerald-500 hover:bg-emerald-600',
    },
    oppose: {
      icon: XCircle,
      label: 'विरोधी',
      bgClass: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
      buttonClass: 'bg-red-500 hover:bg-red-600',
    },
    neutral: {
      icon: Minus,
      label: 'तटस्थ',
      bgClass: 'bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-400',
      buttonClass: 'bg-gray-500 hover:bg-gray-600',
    },
  };

  const currentStatus = statusConfig[voter.status];

  const handleWhatsApp = () => {
    if (!voter.phone) return;
    const message = `नमस्कार ${voter.name} जी! ${candidateName} की ओर से प्रणाम। आपका कीमती वोट हमारे लिए बहुत महत्वपूर्ण है। 🙏`;
    window.open(`https://wa.me/91${voter.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto glass-panel border-l-0 sm:border-l">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {voter.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <SheetTitle className="text-xl font-bold">
                  {voter.name}
                </SheetTitle>
                {voter.name_hindi && (
                  <SheetDescription className="text-base">
                    {voter.name_hindi}
                  </SheetDescription>
                )}
              </div>
            </div>
          </div>

          {/* L/D Status Badge - Prominent */}
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`text-sm px-4 py-1.5 font-semibold ${
                isAlive
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400'
              }`}
            >
              {isAlive ? (
                <>
                  <Heart className="w-4 h-4 mr-1.5 fill-current" />
                  जीवित (Living)
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                  स्वर्गीय (Deceased)
                </>
              )}
            </Badge>
            {voter.has_voted && (
              <Badge className="bg-primary/20 text-primary border-primary">
                <Vote className="w-3.5 h-3.5 mr-1" />
                वोट दिया
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Status Change Section */}
        <Card className="mb-4 glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <currentStatus.icon className="w-4 h-4" />
              मतदाता स्थिति
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`p-3 rounded-xl border ${currentStatus.bgClass}`}>
              <p className="font-semibold text-center text-lg">{currentStatus.label}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={voter.status === 'support' ? 'default' : 'outline'}
                className={voter.status === 'support' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                onClick={() => onStatusChange('support')}
                disabled={pollingMode}
              >
                ✅ समर्थक
              </Button>
              <Button
                size="sm"
                variant={voter.status === 'neutral' ? 'default' : 'outline'}
                className={voter.status === 'neutral' ? 'bg-gray-500 hover:bg-gray-600' : ''}
                onClick={() => onStatusChange('neutral')}
                disabled={pollingMode}
              >
                ⚪ तटस्थ
              </Button>
              <Button
                size="sm"
                variant={voter.status === 'oppose' ? 'default' : 'outline'}
                className={voter.status === 'oppose' ? 'bg-red-500 hover:bg-red-600' : ''}
                onClick={() => onStatusChange('oppose')}
                disabled={pollingMode}
              >
                ❌ विरोधी
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Voter Details */}
        <div className="space-y-4">
          {/* Basic Info Card */}
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                मूल जानकारी
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <InfoRow icon={Hash} label="EPIC No" value={voter.epic_no} mono />
              <InfoRow icon={Hash} label="क्रम संख्या" value={voter.sl_no?.toString()} />
              <InfoRow icon={User} label="लिंग" value={voter.gender} />
              <InfoRow icon={Calendar} label="आयु" value={voter.age?.toString()} suffix="वर्ष" />
              <InfoRow icon={Users} label="जाति" value={voter.caste} />
              {voter.relation_type && (
                <InfoRow 
                  icon={Users} 
                  label="संबंध" 
                  value={getRelationLabel(voter.relation_type)} 
                />
              )}
            </CardContent>
          </Card>

          {/* Guardian Info */}
          {(voter.guardian_name_english || voter.guardian_name_hindi) && (
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  अभिभावक
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <InfoRow icon={Users} label="नाम (EN)" value={voter.guardian_name_english} />
                <InfoRow icon={Users} label="नाम (HI)" value={voter.guardian_name_hindi} />
              </CardContent>
            </Card>
          )}

          {/* Location Info */}
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                स्थान विवरण
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <InfoRow icon={MapPin} label="वार्ड" value={voter.ward?.toString()} />
              <InfoRow icon={Vote} label="बूथ" value={voter.booth} />
              <InfoRow icon={MapPin} label="मकान नं" value={voter.house_no} />
              {voter.address_1 && <InfoRow icon={MapPin} label="पता 1" value={voter.address_1} />}
              {voter.address_2 && <InfoRow icon={MapPin} label="पता 2" value={voter.address_2} />}
              {voter.address_3 && <InfoRow icon={MapPin} label="पता 3" value={voter.address_3} />}
            </CardContent>
          </Card>

          {/* Influence Info */}
          {(voter.main_man_family || voter.impact_level) && (
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  प्रभाव विश्लेषण
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {voter.main_man_family && (
                  <InfoRow icon={Users} label="परिवार मुखिया" value={voter.main_man_family} />
                )}
                {voter.impact_level && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      प्रभाव स्तर
                    </span>
                    <Badge variant="outline" className={getImpactBadgeClass(voter.impact_level)}>
                      {voter.impact_level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="space-y-3 pb-4">
          {pollingMode && isAlive ? (
            <Button
              className={`w-full ${voter.has_voted ? 'bg-emerald-500' : 'btn-saffron'}`}
              size="lg"
              onClick={onMarkVoted}
              disabled={voter.has_voted}
            >
              <Vote className="w-5 h-5 mr-2" />
              {voter.has_voted ? '✓ वोट दर्ज हो चुका' : '🗳️ वोट दर्ज करें'}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {voter.phone && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.open(`tel:${voter.phone}`, '_self')}
                    className="glass-card border-primary/30 hover:bg-primary/10"
                  >
                    <Phone className="w-5 h-5 mr-2 text-primary" />
                    कॉल करें
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleWhatsApp}
                    className="glass-card border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <MessageCircle className="w-5 h-5 mr-2 text-emerald-500" />
                    WhatsApp
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Helper component for info rows
const InfoRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  suffix?: string;
}> = ({ icon: Icon, label, value, mono, suffix }) => {
  if (!value) return null;
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <span className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>
        {value}{suffix ? ` ${suffix}` : ''}
      </span>
    </div>
  );
};

// Helper functions
function getRelationLabel(type: string): string {
  const relations: Record<string, string> = {
    FAT: 'पिता (Father)',
    HUS: 'पति (Husband)',
    MOT: 'माता (Mother)',
  };
  return relations[type.toUpperCase()] || type;
}

function getImpactBadgeClass(level: string): string {
  const levelLower = level.toLowerCase();
  if (levelLower === 'high') return 'bg-emerald-500/20 text-emerald-700 border-emerald-500';
  if (levelLower === 'medium') return 'bg-amber-500/20 text-amber-700 border-amber-500';
  return 'bg-gray-500/20 text-gray-700 border-gray-500';
}

export default VoterProfileSheet;
