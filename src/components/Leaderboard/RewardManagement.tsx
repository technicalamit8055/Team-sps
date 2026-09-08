import React, { useState } from 'react';
import { Gift, Car, Star, Award, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface RewardManagementProps {
  workers: { id: string; name: string }[];
  onAwardReward: (data: {
    workerId: string;
    rewardType: 'bonus_points' | 'priority_logistics' | 'special_task';
    points: number;
    description: string;
  }) => void;
  isLoading: boolean;
  isAwarding: boolean;
}

const rewardTypes = [
  {
    value: 'bonus_points' as const,
    label: 'Bonus Points',
    description: '+50 bonus points for excellent work',
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    defaultPoints: 50,
  },
  {
    value: 'priority_logistics' as const,
    label: 'Priority Logistics 🚗',
    description: 'Assign vehicle or extra campaign material',
    icon: <Car className="w-5 h-5 text-emerald-500" />,
    defaultPoints: 0,
  },
  {
    value: 'special_task' as const,
    label: 'Special Task Completion',
    description: 'Rally organization, VIP visit coordination',
    icon: <Award className="w-5 h-5 text-purple-500" />,
    defaultPoints: 100,
  },
];

export const RewardManagement: React.FC<RewardManagementProps> = ({
  workers,
  onAwardReward,
  isLoading,
  isAwarding,
}) => {
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [rewardType, setRewardType] = useState<'bonus_points' | 'priority_logistics' | 'special_task'>('bonus_points');
  const [points, setPoints] = useState<number>(50);
  const [description, setDescription] = useState<string>('');

  const handleRewardTypeChange = (value: string) => {
    const type = value as 'bonus_points' | 'priority_logistics' | 'special_task';
    setRewardType(type);
    const rewardConfig = rewardTypes.find(r => r.value === type);
    if (rewardConfig) {
      setPoints(rewardConfig.defaultPoints);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorker) {
      toast.error('Please select a worker');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    onAwardReward({
      workerId: selectedWorker,
      rewardType,
      points,
      description: description.trim(),
    });

    // Reset form
    setSelectedWorker('');
    setRewardType('bonus_points');
    setPoints(50);
    setDescription('');
  };

  if (isLoading) {
    return (
      <Card className="glass-card border border-white/30">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border border-white/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-[hsl(var(--saffron))]" />
          Reward Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Worker Selection */}
          <div className="space-y-2">
            <Label htmlFor="worker">Select Worker</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger id="worker">
                <SelectValue placeholder="Choose a worker..." />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reward Type */}
          <div className="space-y-3">
            <Label>Award Type</Label>
            <RadioGroup value={rewardType} onValueChange={handleRewardTypeChange} className="space-y-2">
              {rewardTypes.map((type) => (
                <div
                  key={type.value}
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    rewardType === type.value
                      ? 'border-[hsl(var(--saffron))] bg-[hsl(var(--saffron),0.05)]'
                      : 'border-border hover:border-[hsl(var(--saffron),0.3)]'
                  }`}
                  onClick={() => handleRewardTypeChange(type.value)}
                >
                  <RadioGroupItem value={type.value} id={type.value} />
                  <div className="flex items-center gap-3 flex-1">
                    {type.icon}
                    <div>
                      <Label htmlFor={type.value} className="font-medium cursor-pointer">
                        {type.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Points (if applicable) */}
          {rewardType !== 'priority_logistics' && (
            <div className="space-y-2">
              <Label htmlFor="points">Points to Award</Label>
              <Input
                id="points"
                type="number"
                min={0}
                max={500}
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                className="max-w-[150px]"
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="description">Reason / Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Rally organization success, Exceptional ground work..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full btn-saffron"
            disabled={isAwarding || !selectedWorker || !description.trim()}
          >
            {isAwarding ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Awarding...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Award Reward
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
