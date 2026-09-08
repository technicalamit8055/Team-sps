import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVictory } from '@/contexts/VictoryContext';
import { toast } from 'sonner';

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ open, onClose }) => {
  const { addEvent } = useVictory();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    ward: 1,
    type: 'rally' as const,
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      toast.error('कृपया सभी जानकारी भरें');
      return;
    }
    addEvent(formData);
    toast.success('कार्यक्रम जोड़ा गया!');
    setFormData({ title: '', date: '', time: '', ward: 1, type: 'rally', location: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text-navy">नया कार्यक्रम जोड़ें</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">कार्यक्रम का नाम *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="जैसे: नुक्कड़ सभा"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="location">स्थान</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="कार्यक्रम का स्थान"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">तिथि *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="time">समय</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>प्रकार</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rally">रैली</SelectItem>
                  <SelectItem value="meeting">बैठक</SelectItem>
                  <SelectItem value="padyatra">पदयात्रा</SelectItem>
                  <SelectItem value="other">अन्य</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>वार्ड</Label>
              <Select value={formData.ward.toString()} onValueChange={(v) => setFormData({ ...formData, ward: parseInt(v) })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 13 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>Ward {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              रद्द करें
            </Button>
            <Button type="submit" className="flex-1 btn-saffron">
              जोड़ें
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
