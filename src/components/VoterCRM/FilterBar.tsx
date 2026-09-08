/**
 * FilterBar - Sticky filter bar for Ward and L/D status filtering
 * Glassmorphism design with Saffron/Navy accents
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Heart, AlertCircle, Users } from 'lucide-react';

interface FilterBarProps {
  wards: number[];
  selectedWard: number | null;
  onWardChange: (ward: number | null) => void;
  livingFilter: 'all' | 'living' | 'deceased';
  onLivingFilterChange: (filter: 'all' | 'living' | 'deceased') => void;
  totalFiltered: number;
  totalAll: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  wards,
  selectedWard,
  onWardChange,
  livingFilter,
  onLivingFilterChange,
  totalFiltered,
  totalAll,
}) => {
  const hasActiveFilters = selectedWard !== null || livingFilter !== 'all';

  const clearFilters = () => {
    onWardChange(null);
    onLivingFilterChange('all');
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 py-3 glass-panel rounded-none sm:rounded-xl sm:mx-0 mb-4 border-b sm:border">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filter Icon & Label */}
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>फ़िल्टर</span>
        </div>

        {/* Ward Select */}
        <Select
          value={selectedWard?.toString() || 'all'}
          onValueChange={(val) => onWardChange(val === 'all' ? null : parseInt(val))}
        >
          <SelectTrigger className="w-full sm:w-[140px] glass-card border-secondary/30">
            <SelectValue placeholder="सभी वार्ड" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                सभी वार्ड
              </span>
            </SelectItem>
            {wards.map((ward) => (
              <SelectItem key={ward} value={ward.toString()}>
                वार्ड {ward}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* L/D Filter Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={livingFilter === 'all' ? 'default' : 'outline'}
            className={livingFilter === 'all' ? 'bg-secondary hover:bg-secondary/90' : 'glass-card'}
            onClick={() => onLivingFilterChange('all')}
          >
            सभी
          </Button>
          <Button
            size="sm"
            variant={livingFilter === 'living' ? 'default' : 'outline'}
            className={livingFilter === 'living' ? 'bg-emerald-500 hover:bg-emerald-600' : 'glass-card border-emerald-500/30'}
            onClick={() => onLivingFilterChange('living')}
          >
            <Heart className="w-3.5 h-3.5 mr-1 fill-current" />
            जीवित (L)
          </Button>
          <Button
            size="sm"
            variant={livingFilter === 'deceased' ? 'default' : 'outline'}
            className={livingFilter === 'deceased' ? 'bg-red-500 hover:bg-red-600' : 'glass-card border-red-500/30'}
            onClick={() => onLivingFilterChange('deceased')}
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            स्वर्गीय (D)
          </Button>
        </div>

        {/* Results Count & Clear */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <Badge variant="secondary" className="font-mono">
            {totalFiltered.toLocaleString('hi-IN')} / {totalAll.toLocaleString('hi-IN')}
          </Badge>
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" />
              रीसेट
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-muted-foreground">सक्रिय फ़िल्टर:</span>
          {selectedWard !== null && (
            <Badge variant="outline" className="bg-secondary/10 border-secondary/30">
              वार्ड {selectedWard}
              <button
                onClick={() => onWardChange(null)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {livingFilter === 'living' && (
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700">
              <Heart className="w-3 h-3 mr-1 fill-current" />
              जीवित
              <button
                onClick={() => onLivingFilterChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {livingFilter === 'deceased' && (
            <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-700">
              <AlertCircle className="w-3 h-3 mr-1" />
              स्वर्गीय
              <button
                onClick={() => onLivingFilterChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
