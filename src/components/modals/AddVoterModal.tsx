import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVictory } from '@/contexts/VictoryContext';
import { toast } from 'sonner';

interface AddVoterModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddVoterModal: React.FC<AddVoterModalProps> = ({ open, onClose }) => {
  const { addVoter } = useVictory();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    ward: 1,
    booth: 101,
    caste: 'General',
    status: 'neutral' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('कृपया नाम भरें');
      return;
    }
    addVoter(formData);
    toast.success('मतदाता जोड़ा गया!');
    setFormData({ name: '', phone: '', ward: 1, booth: 101, caste: 'General', status: 'neutral' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text-navy">नया मतदाता जोड़ें</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">नाम *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="मतदाता का नाम"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">मोबाइल नंबर</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="98XXXXXXXX"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>बूथ</Label>
              <Input
                type="number"
                value={formData.booth}
                onChange={(e) => setFormData({ ...formData, booth: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>जाति</Label>
              <Select value={formData.caste} onValueChange={(v) => setFormData({ ...formData, caste: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">सामान्य</SelectItem>
                  <SelectItem value="OBC">OBC</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="EWS">EWS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>स्थिति</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">समर्थक</SelectItem>
                  <SelectItem value="oppose">विरोधी</SelectItem>
                  <SelectItem value="neutral">तटस्थ</SelectItem>
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
