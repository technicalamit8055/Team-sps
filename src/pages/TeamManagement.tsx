import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkerPerformance } from '@/hooks/useWorkerPerformance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { LeaderboardCard, RewardManagement } from '@/components/Leaderboard';
import { Users, UserPlus, Search, Trash2, Phone, MapPin, Shield, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  username: string;
  full_name: string;
  phone: string | null;
  ward_number: number | null;
  role: string;
}

export default function TeamManagement() {
  const { role } = useAuth();
  const {
    leaderboard7Days,
    leaderboard30Days,
    isLoadingLeaderboard,
    allWorkers,
    awardReward,
    isAwardingReward,
    isAdmin,
  } = useWorkerPerformance();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [citizens, setCitizens] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, phone, ward_number');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'unknown'
        };
      });

      // Separate team (admin, manager, worker) and citizens
      const team = usersWithRoles.filter(u => ['admin', 'manager', 'worker'].includes(u.role));
      const citizenList = usersWithRoles.filter(u => u.role === 'citizen');

      setTeamMembers(team);
      setCitizens(citizenList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Users लोड करने में त्रुटि');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`क्या आप ${username} को हटाना चाहते हैं?`)) return;

    try {
      // Note: Actual deletion requires service role key via edge function
      // For now, we'll show a placeholder
      toast.info('User deletion requires admin action');
    } catch (error) {
      toast.error('User हटाने में त्रुटि');
    }
  };

  const getRoleBadge = (userRole: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-600 border-red-500/30',
      manager: 'bg-victory-saffron/10 text-victory-saffron border-victory-saffron/30',
      worker: 'bg-victory-navy/10 text-victory-navy border-victory-navy/30',
      citizen: 'bg-victory-green/10 text-victory-green border-victory-green/30'
    };
    const labels: Record<string, string> = {
      admin: 'Admin',
      manager: 'Manager',
      worker: 'Worker',
      citizen: 'Citizen'
    };
    return (
      <Badge variant="outline" className={styles[userRole] || 'bg-gray-100'}>
        {labels[userRole] || userRole}
      </Badge>
    );
  };

  const filterUsers = (users: TeamMember[]) => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u => 
      u.username?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.phone?.includes(query)
    );
  };

  const UserCard = ({ user }: { user: TeamMember }) => (
    <Card className="glass-card hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">{user.full_name || 'N/A'}</h3>
              {getRoleBadge(user.role)}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-mono text-victory-navy">@{user.username}</p>
              {user.phone && (
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {user.phone}
                </p>
              )}
              {user.ward_number && (
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Ward {user.ward_number}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {role === 'admin' && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteUser(user.id, user.username)}
                className="h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (role !== 'admin' && role !== 'manager') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">आपके पास इस पेज तक पहुंच नहीं है</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-victory-navy">Team Management</h1>
          <p className="text-muted-foreground">टीम और नागरिक खातों का प्रबंधन</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="btn-saffron">
          <UserPlus className="w-4 h-4 mr-2" />
          नया User बनाएं
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="नाम, username या फोन से खोजें..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="citizens" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Janta ({citizens.length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-32 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : filterUsers(teamMembers).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterUsers(teamMembers).map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">कोई Team member नहीं मिला</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="citizens">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-32 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : filterUsers(citizens).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterUsers(citizens).map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">कोई Citizen नहीं मिला</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="grid lg:grid-cols-2 gap-6">
            <LeaderboardCard
              leaderboard7Days={leaderboard7Days}
              leaderboard30Days={leaderboard30Days}
              isLoading={isLoadingLeaderboard}
            />
            {isAdmin && (
              <RewardManagement
                workers={allWorkers}
                onAwardReward={awardReward}
                isLoading={isLoading}
                isAwarding={isAwardingReward}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CreateUserModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
