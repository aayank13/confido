"use client";

import { useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Target, 
  BarChart3,
  PlayCircle,
  Plus,
  Settings,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import type { SessionWithAnalytics } from '../lib/types';
import Image from 'next/image';

interface DashboardStats {
  totalSessions: number;
  totalMinutes: number;
  thisWeekSessions: number;
  averageConfidence: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalMinutes: 0,
    thisWeekSessions: 0,
    averageConfidence: 0
  });
  const [recentSessions, setRecentSessions] = useState<SessionWithAnalytics[]>([]);
  
  const supabase = createClient();
  const router = useRouter();

  // Helper function to format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) {
      return `${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      setUser(user);
      await loadDashboardData();
      setLoading(false);
    };

    getUser();
  }, [router, supabase.auth]);

  const loadDashboardData = async () => {
    try {
      // Load recent sessions
      const sessionsResponse = await fetch('/api/sessions?limit=10');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setRecentSessions(sessionsData || []);

        // Calculate stats from sessions
        const totalSessions = sessionsData.length;
        const totalMinutesRaw = sessionsData.reduce((acc: number, s: SessionWithAnalytics) => acc + (s.duration_seconds || 0) / 60, 0);
        const totalMinutes = Number(totalMinutesRaw.toFixed(2));
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekSessions = sessionsData
          .filter((s: SessionWithAnalytics) => new Date(s.created_at) >= oneWeekAgo).length;

        const avgConfidence = sessionsData
          .filter((s: SessionWithAnalytics) => 
            Array.isArray(s.session_analytics) && 
            s.session_analytics.length > 0 && 
            s.session_analytics[0].confidence_score
          )
          .reduce((acc: number, s: SessionWithAnalytics, _index: number, arr: SessionWithAnalytics[]) => 
            acc + (Array.isArray(s.session_analytics) && s.session_analytics[0]?.confidence_score || 0) / arr.length, 0);

        setStats({
          totalSessions,
          totalMinutes,
          thisWeekSessions,
          averageConfidence: Math.round(avgConfidence * 100)
        });
      }

      // TODO: Load progress and goals when those APIs are ready
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const startNewSession = (agentType: string) => {
    router.push(`/dashboard/session?agent=${agentType}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="flex justify-between items-center p-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold">Confido</span>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {user?.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-gray-400" />
              )}
              <span className="hidden md:block text-sm">{user?.user_metadata?.full_name || user?.email}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <button className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-800 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-800 transition-colors text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-400">Ready to improve your communication skills?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-sm text-gray-400">Total Sessions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMinutes}</p>
                <p className="text-sm text-gray-400">Minutes Practiced</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.thisWeekSessions}</p>
                <p className="text-sm text-gray-400">This Week</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.averageConfidence}%</p>
                <p className="text-sm text-gray-400">Avg Confidence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Start a New Session</h2>
            <button
              onClick={() => router.push('/dashboard/create-agent')}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Agent</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'interview', name: 'Interview Coach', color: 'from-blue-500 to-purple-600', description: 'Practice job interviews' },
              { key: 'conversation', name: 'English Practice', color: 'from-green-500 to-blue-600', description: 'Improve conversation skills' },
              { key: 'confidence', name: 'Confidence Booster', color: 'from-purple-500 to-pink-600', description: 'Build speaking confidence' },
              { key: 'networking', name: 'Networking Coach', color: 'from-orange-500 to-red-600', description: 'Master professional conversations' }
            ].map((agent) => (
              <button
                key={agent.key}
                onClick={() => startNewSession(agent.key)}
                className="text-left p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-colors group"
              >
                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${agent.color} mb-3`}></div>
                <h3 className="font-semibold mb-1 group-hover:text-white transition-colors">{agent.name}</h3>
                <p className="text-sm text-gray-400">{agent.description}</p>
                <PlayCircle className="w-5 h-5 mt-2 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Sessions</h2>
              <button 
                onClick={() => router.push('/dashboard/history')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentSessions.length > 0 ? (
                recentSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{session.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'completed' ? 'bg-green-900 text-green-300' :
                        session.status === 'active' ? 'bg-blue-900 text-blue-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{formatDuration(session.duration_seconds || 0)}</span>
                      <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      {Array.isArray(session.session_analytics) && 
                       session.session_analytics.length > 0 && 
                       session.session_analytics[0] && (
                        <span>Confidence: {Math.round(session.session_analytics[0].confidence_score * 100)}%</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sessions yet. Start your first practice session!</p>
                </div>
              )}
            </div>
          </div>

          {/* Goals Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Goals</h2>
              <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Goals feature coming soon!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
}