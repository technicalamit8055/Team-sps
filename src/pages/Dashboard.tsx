import React from 'react';
import { useVictory } from '@/contexts/VictoryContext';
import { useAuth } from '@/hooks/useAuth';
import { useWorkerPerformance } from '@/hooks/useWorkerPerformance';
import { Users, Target, CheckCircle, Calendar, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { MyImpactCard, LeaderboardCard } from '@/components/Leaderboard';

export const Dashboard: React.FC = () => {
  const { data, totalSupporters, totalExpenses, completedTasks, isLoading } = useVictory();
  const { user, role } = useAuth();
  const {
    myStats,
    isLoadingStats,
    leaderboard7Days,
    leaderboard30Days,
    isLoadingLeaderboard,
    isWorker,
    isAdmin,
    isManager,
  } = useWorkerPerformance();

  const getWardStatus = (ward: typeof data.wards[0]) => {
    const supportPercentage = (ward.supporters / ward.totalVoters) * 100;
    if (supportPercentage >= 50) return 'ward-safe';
    if (supportPercentage >= 30) return 'ward-moderate';
    return 'ward-weak';
  };

  const kpiCards = [
    {
      label: 'कुल मतदाता',
      value: data.settings.totalVoters.toLocaleString('hi-IN'),
      icon: <Users className="w-6 h-6" />,
      color: 'text-navy',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'लक्ष्य',
      value: data.settings.winningGoal.toLocaleString('hi-IN'),
      icon: <Target className="w-6 h-6" />,
      color: 'text-primary',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'पक्के समर्थक',
      value: totalSupporters.toLocaleString('hi-IN'),
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'शेष दिन',
      value: data.settings.daysLeft.toString(),
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];


  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card">
              <Skeleton className="w-12 h-12 rounded-xl mb-3" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="glass-panel p-5">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-3">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            जय हो! 🙏
          </h1>
          <p className="text-muted-foreground mt-1">{data.settings.candidateName} • {data.settings.constituency}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium">Live Sync</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={card.label}
            className={`kpi-card animate-slide-in-up stagger-${index + 1}`}
          >
            <div className={`w-12 h-12 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className={`text-2xl lg:text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Ward Heatmap */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">वार्ड हीटमैप</h2>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-3">
          {data.wards.map((ward) => (
            <div
              key={ward.id}
              className={`ward-cell ${getWardStatus(ward)}`}
              title={`Ward ${ward.id}: ${Math.round((ward.supporters / ward.totalVoters) * 100)}% Support`}
            >
              <span className="text-lg">{ward.id}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span>Safe (50%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span>Moderate (30-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Weak (&lt;30%)</span>
          </div>
        </div>
      </div>

      {/* Worker My Impact Card - Only visible to workers */}
      {isWorker && (
        <MyImpactCard stats={myStats} isLoading={isLoadingStats} />
      )}

      {/* Poll Chart & Victory Leaderboard */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Poll Trend Chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">मतदान रुझान</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.pollData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="votes"
                  stroke="hsl(30, 100%, 50%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(30, 100%, 50%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Victory Leaderboard - Conversion based */}
        <LeaderboardCard
          leaderboard7Days={leaderboard7Days}
          leaderboard30Days={leaderboard30Days}
          isLoading={isLoadingLeaderboard}
          currentUserId={user?.id}
        />
      </div>


      {/* Live Feed */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-lg font-semibold">लाइव फ़ीड</h2>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {data.activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">कोई हालिया गतिविधि नहीं</p>
          ) : (
            data.activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="feed-item">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'voter' ? 'bg-emerald-500' :
                  activity.type === 'expense' ? 'bg-amber-500' :
                  activity.type === 'task' ? 'bg-blue-500' : 'bg-purple-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })} • {activity.user}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
