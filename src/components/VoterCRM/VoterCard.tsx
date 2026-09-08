/**
 * VoterCard - Mobile-optimized voter display with status toggle
 * Supports quick status changes and contact actions
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Printer, Trash2, CheckCircle } from 'lucide-react';
import type { CRMVoter } from '@/hooks/useVoterCRM';

interface VoterCardProps {
  voter: CRMVoter;
  pollingMode: boolean;
  isAdmin: boolean;
  candidateName: string;
  onStatusChange: (status: 'support' | 'oppose' | 'neutral') => void;
  onMarkVoted: () => void;
  onDelete: () => void;
  onPrint: () => void;
}

export const VoterCard: React.FC<VoterCardProps> = ({
  voter,
  pollingMode,
  isAdmin,
  candidateName,
  onStatusChange,
  onMarkVoted,
  onDelete,
  onPrint,
}) => {
  const statusColors = {
    support: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
    oppose: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    neutral: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
  };

  const statusLabels = {
    support: '✅ समर्थक',
    oppose: '❌ विरोधी',
    neutral: '⚪ तटस्थ',
  };

  const handleWhatsApp = () => {
    if (!voter.phone) return;
    const message = `नमस्कार ${voter.name} जी! ${candidateName} की ओर से प्रणाम। आपका कीमती वोट हमारे लिए बहुत महत्वपूर्ण है। 🙏`;
    window.open(`https://wa.me/91${voter.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const cycleStatus = () => {
    const statusOrder: ('support' | 'oppose' | 'neutral')[] = ['neutral', 'support', 'oppose'];
    const currentIndex = statusOrder.indexOf(voter.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    onStatusChange(nextStatus);
  };

  return (
    <div className={`glass-panel p-4 transition-all duration-200 ${voter.has_voted ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left: Voter Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {voter.sl_no && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-mono rounded">
                #{voter.sl_no}
              </span>
            )}
            <h3 className="font-semibold truncate">{voter.name}</h3>
            {voter.has_voted && (
              <CheckCircle className="flex-shrink-0 w-4 h-4 text-emerald-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Ward {voter.ward || '-'} • Booth {voter.booth || '-'}
            {voter.caste && ` • ${voter.caste}`}
          </p>
          {voter.phone && (
            <p className="text-sm text-muted-foreground mt-0.5">📱 {voter.phone}</p>
          )}
        </div>

        {/* Right: Status Toggle Button */}
        <button
          onClick={cycleStatus}
          disabled={pollingMode}
          className={`
            flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm
            transition-all duration-200 active:scale-95
            ${statusColors[voter.status]}
            ${pollingMode ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
          `}
        >
          {statusLabels[voter.status]}
        </button>
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {pollingMode ? (
          <Button
            size="sm"
            className={voter.has_voted ? 'bg-emerald-500 hover:bg-emerald-600' : 'btn-saffron'}
            onClick={onMarkVoted}
            disabled={voter.has_voted}
          >
            {voter.has_voted ? '✓ वोट दिया' : '🗳️ वोट दर्ज करें'}
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
            <Button size="sm" variant="outline" onClick={onPrint}>
              <Printer className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive ml-auto"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
