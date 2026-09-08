import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVictory } from '@/contexts/VictoryContext';
import { toast } from 'sonner';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ open, onClose }) => {
  const { addTask } = useVictory();
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: '',
    ward: 1,
    dueDate: '',
    completed: false,
    priority: 'medium' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('कृपया कार्य का विवरण भरें');
      return;
    }
    addTask(formData);
    toast.success('कार्य जोड़ा गया!');
    setFormData({ title: '', assignedTo: '', ward: 1, dueDate: '', completed: false, priority: 'medium' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text-navy">नया कार्य जोड़ें</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">कार्य विवरण *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="क्या करना है?"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="assignedTo">किसे सौंपा</Label>
            <Input
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              placeholder="कार्यकर्ता का नाम"
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
              <Label>प्राथमिकता</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as any })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">उच्च</SelectItem>
                  <SelectItem value="medium">मध्यम</SelectItem>
                  <SelectItem value="low">निम्न</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="dueDate">अंतिम तिथि</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="mt-1"
            />
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
