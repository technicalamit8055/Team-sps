import React, { useState } from 'react';
import { useVictory } from '@/contexts/VictoryContext';
import { Plus, UserPlus, IndianRupee, ClipboardList, Calendar, X } from 'lucide-react';
import { AddVoterModal } from './modals/AddVoterModal';
import { AddExpenseModal } from './modals/AddExpenseModal';
import { AddTaskModal } from './modals/AddTaskModal';
import { AddEventModal } from './modals/AddEventModal';

export const FAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'voter' | 'expense' | 'task' | 'event' | null>(null);

  const actions = [
    { id: 'voter' as const, icon: <UserPlus className="w-5 h-5" />, label: 'Add Voter', color: 'bg-emerald-500' },
    { id: 'expense' as const, icon: <IndianRupee className="w-5 h-5" />, label: 'Add Expense', color: 'bg-amber-500' },
    { id: 'task' as const, icon: <ClipboardList className="w-5 h-5" />, label: 'Add Task', color: 'bg-blue-500' },
    { id: 'event' as const, icon: <Calendar className="w-5 h-5" />, label: 'Add Event', color: 'bg-purple-500' },
  ];

  const handleAction = (actionId: typeof actions[number]['id']) => {
    setActiveModal(actionId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action buttons */}
      {isOpen && (
        <div className="fixed z-50 flex flex-col-reverse gap-3" style={{ bottom: '180px', right: '20px' }}>
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-full ${action.color} text-white shadow-lg animate-slide-in-up`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {action.icon}
              <span className="font-medium text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fab-button transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>

      {/* Modals */}
      <AddVoterModal open={activeModal === 'voter'} onClose={() => setActiveModal(null)} />
      <AddExpenseModal open={activeModal === 'expense'} onClose={() => setActiveModal(null)} />
      <AddTaskModal open={activeModal === 'task'} onClose={() => setActiveModal(null)} />
      <AddEventModal open={activeModal === 'event'} onClose={() => setActiveModal(null)} />
    </>
  );
};
