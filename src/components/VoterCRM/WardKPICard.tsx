/**
 * WardKPICard - Displays ward health and statistics
 * Shows support percentage with color-coded health indicator
 */
import React from 'react';
import type { WardAnalytics } from '@/hooks/useVoterCRM';
import { Users, ThumbsUp, ThumbsDown, Minus, CheckCircle } from 'lucide-react';

interface WardKPICardProps {
  analytics: WardAnalytics;
  isSelected: boolean;
  onClick: () => void;
}

export const WardKPICard: React.FC<WardKPICardProps> = ({ analytics, isSelected, onClick }) => {
  const healthColors = {
    safe: 'from-emerald-500 to-emerald-600',
    moderate: 'from-amber-500 to-amber-600',
    weak: 'from-red-500 to-red-600',
  };

  const healthLabels = {
    safe: '🟢 सुरक्षित',
    moderate: '🟡 संघर्षपूर्ण',
    weak: '🔴 कमजोर',
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-40 p-3 rounded-xl transition-all duration-300
        ${isSelected 
          ? `bg-gradient-to-br ${healthColors[analytics.health]} text-white shadow-lg scale-105` 
          : 'glass-panel hover:shadow-md hover:scale-102'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>
          Ward {analytics.ward}
        </span>
        <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
          {analytics.supportPercentage}%
        </span>
      </div>
      
      <div className={`text-xs mb-2 ${isSelected ? 'text-white/90' : 'text-muted-foreground'}`}>
        {healthLabels[analytics.health]}
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3" />
          <span>{analytics.support}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsDown className="w-3 h-3" />
          <span>{analytics.oppose}</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="w-3 h-3" />
          <span>{analytics.neutral}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          <span>{analytics.voted}</span>
        </div>
      </div>
    </button>
  );
};
