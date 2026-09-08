import React from 'react';
import { useVictory } from '@/contexts/VictoryContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, Package, ClipboardList, Trash2, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';

export const Operations: React.FC = () => {
  const { data, totalExpenses, deleteExpense, toggleTask, deleteTask, updateInventoryItem, deleteInventoryItem, isLoading } = useVictory();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Publicity': return '📢';
      case 'Events': return '🎪';
      case 'Transport': return '🚗';
      case 'Food': return '🍽️';
      default: return '📦';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="glass-panel p-6 mb-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">कार्य प्रबंधन (Ops)</h1>
        <p className="text-muted-foreground">वित्त, सामग्री और कार्य</p>
      </div>

      <Tabs defaultValue="finance" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="finance" className="flex items-center gap-2 rounded-lg">
            <IndianRupee className="w-4 h-4" />
            वित्त
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2 rounded-lg">
            <Package className="w-4 h-4" />
            सामग्री
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2 rounded-lg">
            <ClipboardList className="w-4 h-4" />
            कार्य
          </TabsTrigger>
        </TabsList>

        {/* Finance Tab */}
        <TabsContent value="finance" className="mt-6">
          {/* Total Expense Card */}
          <div className="glass-panel p-6 mb-6 bg-gradient-to-r from-amber-50 to-orange-50">
            <p className="text-sm text-muted-foreground">कुल खर्च</p>
            <p className="text-4xl font-bold text-primary">
              ₹{totalExpenses.toLocaleString('hi-IN')}
            </p>
          </div>

          {/* Expense List */}
          {data.expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IndianRupee className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>कोई खर्च दर्ज नहीं है</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.expenses.map((expense) => (
                <div key={expense.id} className="glass-panel p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                      <div>
                        <h3 className="font-semibold">{expense.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {expense.category} {expense.ward > 0 ? `• Ward ${expense.ward}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(expense.date), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">₹{expense.amount.toLocaleString('hi-IN')}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 mt-2"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="mt-6">
          {data.inventory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>कोई सामग्री नहीं है</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.inventory.map((item) => (
                <div key={item.id} className="glass-panel p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => deleteInventoryItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (item.quantity > 0) {
                          updateInventoryItem(item.id, { quantity: item.quantity - 1 });
                        }
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-navy">{item.quantity}</p>
                      <p className="text-xs text-muted-foreground">{item.unit}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateInventoryItem(item.id, { quantity: item.quantity + 1 })}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          {data.tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>कोई कार्य नहीं है</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`glass-panel p-4 transition-opacity ${task.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'high' ? 'उच्च' : task.priority === 'medium' ? 'मध्यम' : 'निम्न'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.assignedTo} • Ward {task.ward}
                        {task.dueDate && ` • ${format(new Date(task.dueDate), 'dd MMM')}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
