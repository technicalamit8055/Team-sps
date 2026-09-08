/**
 * VoterDataTable - Desktop data table view for voter list
 * Features: Sortable columns, L/D badge, clickable rows
 */
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Heart, AlertCircle } from 'lucide-react';
import type { CRMVoter } from '@/hooks/useVoterCRM';

interface VoterDataTableProps {
  voters: CRMVoter[];
  onRowClick: (voter: CRMVoter) => void;
  isLoading?: boolean;
}

export const VoterDataTable: React.FC<VoterDataTableProps> = ({
  voters,
  onRowClick,
  isLoading,
}) => {
  const getStatusBadge = (status: string) => {
    const config = {
      support: { label: '✅ समर्थक', class: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' },
      oppose: { label: '❌ विरोधी', class: 'bg-red-500/20 text-red-700 border-red-500/30' },
      neutral: { label: '⚪ तटस्थ', class: 'bg-gray-500/20 text-gray-700 border-gray-500/30' },
    };
    const cfg = config[status as keyof typeof config] || config.neutral;
    return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
  };

  const getGenderBadge = (gender: string | null) => {
    if (!gender) return null;
    const genderLower = gender.toLowerCase();
    if (genderLower === 'm' || genderLower === 'male' || genderLower === 'पुरुष') {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">पुरुष</Badge>;
    }
    if (genderLower === 'f' || genderLower === 'female' || genderLower === 'महिला') {
      return <Badge variant="outline" className="bg-pink-500/10 text-pink-700 border-pink-500/30">महिला</Badge>;
    }
    return <Badge variant="outline">{gender}</Badge>;
  };

  const getLDBadge = (isAlive: boolean | null | undefined) => {
    const alive = isAlive !== false;
    return (
      <Badge
        variant="outline"
        className={`font-semibold ${
          alive
            ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/50'
            : 'bg-red-500/20 text-red-700 border-red-500/50'
        }`}
      >
        {alive ? (
          <><Heart className="w-3 h-3 mr-1 fill-current" />L</>
        ) : (
          <><AlertCircle className="w-3 h-3 mr-1" />D</>
        )}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/5 hover:bg-secondary/5">
            <TableHead className="w-20 font-semibold">क्रम सं</TableHead>
            <TableHead className="font-semibold">नाम</TableHead>
            <TableHead className="w-24 font-semibold">वार्ड</TableHead>
            <TableHead className="w-24 font-semibold">बूथ</TableHead>
            <TableHead className="w-20 font-semibold text-center">लिंग</TableHead>
            <TableHead className="w-20 font-semibold text-center">L/D</TableHead>
            <TableHead className="w-28 font-semibold text-center">स्थिति</TableHead>
            <TableHead className="w-20 font-semibold text-center">वोट</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voters.map((voter) => (
            <TableRow
              key={voter.id}
              onClick={() => onRowClick(voter)}
              className={`cursor-pointer transition-all hover:bg-primary/5 ${
                voter.is_alive === false ? 'opacity-60 bg-red-50/50 dark:bg-red-950/20' : ''
              }`}
            >
              <TableCell className="font-mono text-sm text-muted-foreground">
                {voter.sl_no ? `#${voter.sl_no}` : '-'}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{voter.name}</p>
                  {voter.phone && (
                    <p className="text-xs text-muted-foreground">📱 {voter.phone}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono">
                  W{voter.ward || '-'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{voter.booth || '-'}</TableCell>
              <TableCell className="text-center">
                {getGenderBadge(voter.gender)}
              </TableCell>
              <TableCell className="text-center">
                {getLDBadge(voter.is_alive)}
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(voter.status)}
              </TableCell>
              <TableCell className="text-center">
                {voter.has_voted && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VoterDataTable;
