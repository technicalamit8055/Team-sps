import React, { useState } from 'react';
import { useVictory } from '@/contexts/VictoryContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Users, IndianRupee, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const GroundZero: React.FC = () => {
  const { data, deleteEvent, isLoading } = useVictory();
  const [selectedWard, setSelectedWard] = useState<number | null>(null);

  const getWardStats = (wardId: number) => {
    const ward = data.wards.find(w => w.id === wardId);
    const voters = data.voters.filter(v => v.ward === wardId);
    const expenses = data.expenses.filter(e => e.ward === wardId).reduce((sum, e) => sum + e.amount, 0);
    const events = data.events.filter(e => e.ward === wardId);
    
    return { ward, voters, expenses, events };
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'rally': return '📢';
      case 'meeting': return '🤝';
      case 'padyatra': return '🚶';
      default: return '📌';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="glass-panel p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-2">
            {Array.from({ length: 13 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">ग्राउंड ज़ीरो</h1>
        <p className="text-muted-foreground">वार्ड विश्लेषण और कार्यक्रम</p>
      </div>

      <Tabs defaultValue="ward360" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="ward360" className="flex items-center gap-2 rounded-lg">
            <MapPin className="w-4 h-4" />
            Ward 360°
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 rounded-lg">
            <Calendar className="w-4 h-4" />
            कार्यक्रम ({data.events.length})
          </TabsTrigger>
        </TabsList>

        {/* Ward 360 Tab */}
        <TabsContent value="ward360" className="mt-6">
          {/* Ward Selector */}
          <div className="glass-panel p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-3">वार्ड चुनें</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-2">
              {data.wards.map((ward) => {
                const supportPercentage = Math.round((ward.supporters / ward.totalVoters) * 100);
                return (
                  <button
                    key={ward.id}
                    onClick={() => setSelectedWard(ward.id === selectedWard ? null : ward.id)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-white font-bold transition-all ${
                      selectedWard === ward.id
                        ? 'ring-4 ring-primary ring-offset-2 scale-105'
                        : ''
                    } ${
                      supportPercentage >= 50
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                        : supportPercentage >= 30
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                        : 'bg-gradient-to-br from-red-500 to-red-600'
                    }`}
                  >
                    <span className="text-lg">{ward.id}</span>
                    <span className="text-xs opacity-80">{supportPercentage}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ward Details */}
          {selectedWard && (
            <div className="space-y-4 animate-slide-in-up">
              {(() => {
                const { ward, voters, expenses } = getWardStats(selectedWard);
                if (!ward) return null;

                return (
                  <>
                    <div className="glass-panel p-5">
                      <h2 className="text-xl font-bold mb-4">Ward {selectedWard} विश्लेषण</h2>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-blue-50">
                          <Users className="w-5 h-5 text-blue-600 mb-2" />
                          <p className="text-2xl font-bold text-blue-600">{ward.totalVoters}</p>
                          <p className="text-xs text-muted-foreground">कुल मतदाता</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50">
                          <div className="w-5 h-5 text-emerald-600 mb-2">👍</div>
                          <p className="text-2xl font-bold text-emerald-600">{ward.supporters}</p>
                          <p className="text-xs text-muted-foreground">समर्थक</p>
                        </div>
                        <div className="p-4 rounded-xl bg-red-50">
                          <div className="w-5 h-5 text-red-600 mb-2">👎</div>
                          <p className="text-2xl font-bold text-red-600">{ward.opponents}</p>
                          <p className="text-xs text-muted-foreground">विरोधी</p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50">
                          <IndianRupee className="w-5 h-5 text-amber-600 mb-2" />
                          <p className="text-2xl font-bold text-amber-600">₹{expenses.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">खर्च</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span>समर्थन स्तर</span>
                          <span className="font-semibold">{Math.round((ward.supporters / ward.totalVoters) * 100)}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${(ward.supporters / ward.totalVoters) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recent Voters in Ward */}
                    <div className="glass-panel p-5">
                      <h3 className="font-semibold mb-3">हाल के मतदाता ({voters.length})</h3>
                      {voters.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">इस वार्ड में कोई मतदाता नहीं</p>
                      ) : (
                        <div className="space-y-2">
                          {voters.slice(0, 5).map((voter) => (
                            <div key={voter.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="font-medium">{voter.name}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                voter.status === 'support' ? 'bg-emerald-100 text-emerald-700' :
                                voter.status === 'oppose' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {voter.status === 'support' ? 'समर्थक' : voter.status === 'oppose' ? 'विरोधी' : 'तटस्थ'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {!selectedWard && (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>विस्तृत जानकारी के लिए कोई वार्ड चुनें</p>
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <div className="space-y-4">
            {data.events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>कोई कार्यक्रम नहीं है</p>
              </div>
            ) : (
              data.events.map((event) => (
                <div key={event.id} className="glass-panel p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getEventTypeIcon(event.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-muted-foreground">
                        {event.location} • Ward {event.ward}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.date), 'dd MMM yyyy')}
                        </span>
                        {event.time && (
                          <span>🕐 {event.time}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
