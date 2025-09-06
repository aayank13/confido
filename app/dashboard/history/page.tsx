'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Volume2, 
  BarChart3,
  Search
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface SessionWithAnalytics {
  id: string;
  agent_id: string;
  duration_seconds: number;
  status: string;
  created_at: string;
  session_analytics: {
    id: string;
    confidence_score: number;
    voice_analysis: Record<string, unknown>;
    speaking_rate: number;
    volume_consistency: number;
  }[];
  custom_agents: {
    name: string;
    description: string;
  } | null;
}

export default function SessionHistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionWithAnalytics[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithAnalytics[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions?include_analytics=true');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const filterAndSortSessions = useCallback(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.custom_agents?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => session.status === filterStatus);
    }

    // Apply period filter
    if (filterPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filterPeriod) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(session => 
        new Date(session.created_at) >= filterDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'duration':
          return b.duration_seconds - a.duration_seconds;
        case 'confidence': {
          const aConfidence = a.session_analytics?.[0]?.confidence_score || 0;
          const bConfidence = b.session_analytics?.[0]?.confidence_score || 0;
          return bConfidence - aConfidence;
        }
        default:
          return 0;
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, searchQuery, filterStatus, filterPeriod, sortBy]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      setUser(user);
      await loadSessions();
      setLoading(false);
    };

    getUser();
  }, [router, supabase.auth]);

  useEffect(() => {
    filterAndSortSessions();
  }, [filterAndSortSessions]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading session history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold">Confido</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold">Session History</h1>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>

              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="duration">Sort by Duration</option>
                <option value="confidence">Sort by Confidence</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length > 0 ? (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const formatted = formatDate(session.created_at);
              const confidence = session.session_analytics?.[0]?.confidence_score || 0;
              
              return (
                <div
                  key={session.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {session.custom_agents?.name || 'Default Coach'}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {session.custom_agents?.description || 'AI Communication Coach'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          session.status === 'completed' 
                            ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                            : session.status === 'active'
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                            : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {session.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-white">{formatted.date}</div>
                            <div className="text-gray-400">{formatted.time}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-white">{formatDuration(session.duration_seconds)}</div>
                            <div className="text-gray-400">Duration</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <div className="text-sm">
                            <div className={`font-medium ${getConfidenceColor(confidence)}`}>
                              {Math.round(confidence)}%
                            </div>
                            <div className="text-gray-400">Confidence</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-white">
                              {session.session_analytics?.length || 0}
                            </div>
                            <div className="text-gray-400">Analytics</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/session/${session.id}`)}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Sessions Found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || filterStatus !== 'all' || filterPeriod !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Start your first coaching session to see your progress here.'}
            </p>
            <button
              onClick={() => router.push('/dashboard/session')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Start New Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
