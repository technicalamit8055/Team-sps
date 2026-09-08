/**
 * VoterMobileCard - Mobile-optimized expandable card for voter list
 * Features: Tap to expand, prominent L/D badge, quick actions
 */
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  Phone,
  MessageCircle,
  Heart,
  AlertCircle,
  CheckCircle2,
  Vote,
  MapPin,
  User,
} from 'lucide-react';
import type { CRMVoter } from '@/hooks/useVoterCRM';

interface VoterMobileCardProps {
  voter: CRMVoter;
  onViewProfile: () => void;
  onStatusChange: (status: 'support' | 'oppose' | 'neutral') => void;
  onMarkVoted: () => void;
  candidateName: string;
  pollingMode: boolean;
}

export const VoterMobileCard: React.FC<VoterMobileCardProps> = ({
  voter,
  onViewProfile,
  onStatusChange,
  onMarkVoted,
  candidateName,
  pollingMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAlive = voter.is_alive !== false;

  const statusColors = {
    support: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700',
    oppose: 'bg-red-500/20 border-red-500/50 text-red-700',
    neutral: 'bg-gray-500/20 border-gray-500/50 text-gray-700',
  };

  const statusLabels = {
    support: '✅ समर्थक',
    oppose: '❌ विरोधी',
    neutral: '⚪ तटस्थ',
  };

  const handleWhatsApp = () => {
    if (!voter.phone) return;
    const message = `नमस्कार ${voter.name} जी! ${candidateName} की ओर से प्रणाम। 🙏`;
    window.open(`https://wa.me/91${voter.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const cycleStatus = () => {
    const statusOrder: ('support' | 'oppose' | 'neutral')[] = ['neutral', 'support', 'oppose'];
    const currentIndex = statusOrder.indexOf(voter.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    onStatusChange(nextStatus);
  };

  return (
    <div
      className={`glass-panel overflow-hidden transition-all ${
        voter.is_alive === false ? 'opacity-70 border-red-500/30' : ''
      } ${voter.has_voted ? 'border-emerald-500/30' : ''}`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              {/* Left: Voter Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {voter.sl_no && (
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-mono rounded">
                      #{voter.sl_no}
                    </span>
                  )}
                  {/* L/D Badge - Prominent */}
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold ${
                      isAlive
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700'
                        : 'bg-red-500/20 border-red-500 text-red-700'
                    }`}
                  >
                    {isAlive ? (
                      <><Heart className="w-3 h-3 mr-0.5 fill-current" />L</>
                    ) : (
                      <><AlertCircle className="w-3 h-3 mr-0.5" />D</>
                    )}
                  </Badge>
                  {voter.has_voted && (
                    <Badge className="bg-primary/20 text-primary border-primary text-xs">
                      <Vote className="w-3 h-3 mr-0.5" />
                      वोट
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-foreground truncate">{voter.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>W{voter.ward || '-'}</span>
                  <span>•</span>
                  <span>B{voter.booth || '-'}</span>
                  {voter.gender && (
                    <>
                      <span>•</span>
                      <User className="w-3.5 h-3.5" />
                      <span>{voter.gender === 'M' ? 'पु' : voter.gender === 'F' ? 'म' : voter.gender}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Status + Expand */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!pollingMode) cycleStatus();
                  }}
                  disabled={pollingMode}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    statusColors[voter.status]
                  } ${pollingMode ? 'opacity-50' : 'active:scale-95'}`}
                >
                  {statusLabels[voter.status]}
                </button>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-100 dark:border-gray-800">
            {/* Extended Info */}
            <div className="grid grid-cols-2 gap-3 text-sm pt-3">
              {voter.epic_no && (
                <div>
                  <span className="text-muted-foreground text-xs">EPIC</span>
                  <p className="font-mono font-medium">{voter.epic_no}</p>
                </div>
              )}
              {voter.age && (
                <div>
                  <span className="text-muted-foreground text-xs">आयु</span>
                  <p className="font-medium">{voter.age} वर्ष</p>
                </div>
              )}
              {voter.caste && (
                <div>
                  <span className="text-muted-foreground text-xs">जाति</span>
                  <p className="font-medium">{voter.caste}</p>
                </div>
              )}
              {voter.phone && (
                <div>
                  <span className="text-muted-foreground text-xs">मोबाइल</span>
                  <p className="font-medium">📱 {voter.phone}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {pollingMode && isAlive ? (
                <Button
                  size="sm"
                  className={`flex-1 ${voter.has_voted ? 'bg-emerald-500' : 'btn-saffron'}`}
                  onClick={onMarkVoted}
                  disabled={voter.has_voted}
                >
                  {voter.has_voted ? '✓ वोट दिया' : '🗳️ वोट दर्ज'}
                </Button>
              ) : (
                <>
                  {voter.phone && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${voter.phone}`, '_self')}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600"
                        onClick={handleWhatsApp}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={onViewProfile}
                  >
                    विस्तृत प्रोफ़ाइल
                  </Button>
                </>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default VoterMobileCard;
