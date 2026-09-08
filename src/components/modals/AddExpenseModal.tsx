import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVictory } from '@/contexts/VictoryContext';
import { toast } from 'sonner';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ open, onClose }) => {
  const { addExpense } = useVictory();
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'Publicity',
    ward: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || formData.amount <= 0) {
      toast.error('कृपया सभी जानकारी भरें');
      return;
    }
    addExpense(formData);
    toast.success('खर्च दर्ज किया गया!');
    setFormData({ description: '', amount: 0, category: 'Publicity', ward: 0 });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text-navy">नया खर्च जोड़ें</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="description">विवरण *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="खर्च का विवरण"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="amount">राशि (₹) *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>श्रेणी</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Publicity">प्रचार सामग्री</SelectItem>
                  <SelectItem value="Events">कार्यक्रम</SelectItem>
                  <SelectItem value="Transport">यातायात</SelectItem>
                  <SelectItem value="Food">भोजन/जलपान</SelectItem>
                  <SelectItem value="Other">अन्य</SelectItem>
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
                  <SelectItem value="0">सभी वार्ड</SelectItem>
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
