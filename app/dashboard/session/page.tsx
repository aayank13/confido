'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { Square, Play, ArrowLeft, Clock, BarChart3, Volume2, Edit3, Trash2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

// Reuse existing voice bot components
import { App } from '../../components/App';
import { stsConfig } from '../../lib/constants';

interface SessionData {
  id: string;
  agent_id: string;
  duration_seconds: number;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  voice_id: string;
  is_featured: boolean;
  user_id?: string | null;
}

function SessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get agent parameter from URL
  const agentParam = searchParams.get('agent');

  // Create STS config for the selected agent
  const createAgentStsConfig = (agent: Agent | null) => {
    if (!agent) return stsConfig;
    
    return {
      ...stsConfig,
      agent: {
        ...stsConfig.agent,
        think: {
          ...stsConfig.agent.think,
          prompt: agent.system_prompt || stsConfig.agent.think.prompt,
        },
      },
    };
  };

  const loadAgents = useCallback(async () => {
    try {
      // Load featured agents (no auth needed)
      const featuredResponse = await fetch('/api/agents?type=featured');
      const featuredAgents = featuredResponse.ok ? await featuredResponse.json() : [];
      
      // Load user's custom agents (auth needed) - use supabase client for auth
      const { data: { session } } = await supabase.auth.getSession();
      let customAgents = [];
      
      if (session) {
        const customResponse = await fetch('/api/agents?type=my', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        customAgents = customResponse.ok ? await customResponse.json() : [];
      }
      
      // Combine and deduplicate
      const allAgents = [...featuredAgents, ...customAgents];
      setAvailableAgents(allAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  }, [supabase]);

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete "${agentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Remove from local state
        setAvailableAgents(prev => prev.filter(agent => agent.id !== agentId));
        // If this was the selected agent, clear selection
        if (selectedAgent?.id === agentId) {
          setSelectedAgent(null);
        }
      } else {
        alert('Failed to delete agent. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent. Please try again.');
    }
  };

  const handleEditAgent = (agentId: string) => {
    router.push(`/dashboard/edit-agent?id=${agentId}`);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      setUser(user);
      await loadAgents();
      setLoading(false);
    };

    getUser();
  }, [router, supabase.auth, loadAgents]);

  useEffect(() => {
    if (agentParam && availableAgents.length > 0) {
      let agent = null;
      
      // First try to find by exact ID match
      agent = availableAgents.find(a => a.id === agentParam);
      
      if (!agent) {
        // Try to find by agent type mapping
        const agentTypeMapping: { [key: string]: string } = {
          'interview': 'Senior Software Engineer Interview',
          'conversation': 'English Pronunciation Coach',
          'confidence': 'TED Talk Presentation Coach',
          'networking': 'TED Talk Presentation Coach' // fallback
        };
        
        const targetName = agentTypeMapping[agentParam.toLowerCase()];
        if (targetName) {
          agent = availableAgents.find(a => a.name === targetName);
        }
      }
      
      if (!agent) {
        // Fallback: try partial name match
        agent = availableAgents.find(a => 
          a.name.toLowerCase().includes(agentParam.toLowerCase())
        );
      }
      
      if (agent) {
        setSelectedAgent(agent);
      }
    }
  }, [agentParam, availableAgents]);

  useEffect(() => {
    if (isSessionActive && sessionStartTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSessionActive, sessionStartTime]);

  const startSession = async () => {
    if (!selectedAgent || !user) return;

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: 'custom',
          custom_agent_id: selectedAgent.id,
          title: `${selectedAgent.name} Session - ${new Date().toLocaleDateString()}`
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessionData(newSession);
        setSessionStartTime(new Date());
        setIsSessionActive(true);
        setElapsedTime(0);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionData) return;

    try {
      const response = await fetch(`/api/sessions/${sessionData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          duration_seconds: elapsedTime,
        }),
      });

      if (response.ok) {
        setIsSessionActive(false);
        setSessionData(null);
        setSessionStartTime(null);
        setElapsedTime(0);
        
        // Redirect back to dashboard with success message
        router.push('/dashboard?session=completed');
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading session...</div>
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

          {/* Session Status */}
          <div className="flex items-center space-x-4">
            {isSessionActive && (
              <div className="flex items-center space-x-2 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/30">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-mono">{formatTime(elapsedTime)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {!isSessionActive ? (
          // Agent Selection & Session Setup
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Start Coaching Session</h1>
              <p className="text-gray-400">Choose an AI coach to practice with</p>
            </div>

            {/* Agent Selection */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {availableAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-6 rounded-xl border transition-all relative ${
                    selectedAgent?.id === agent.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  {/* Edit/Delete buttons for custom agents */}
                  {!agent.is_featured && agent.user_id === user?.id && (
                    <div className="absolute top-3 right-3 flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAgent(agent.id);
                        }}
                        className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
                        title="Edit agent"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent.id, agent.name);
                        }}
                        className="p-1.5 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors"
                        title="Delete agent"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  <div 
                    onClick={() => setSelectedAgent(agent)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Volume2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{agent.name}</h3>
                        {agent.is_featured ? (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                            Featured
                          </span>
                        ) : (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{agent.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <BarChart3 className="w-4 h-4" />
                      <span>Real-time feedback</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Start Session Button */}
            {selectedAgent && (
              <div className="text-center">
                <button
                  onClick={startSession}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Session with {selectedAgent.name}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Active Session Interface
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Voice Interface */}
              <div className="lg:col-span-2">
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                      Coaching with {selectedAgent?.name}
                    </h2>
                    <p className="text-gray-400">{selectedAgent?.description}</p>
                  </div>

                  {/* Voice Bot Interface */}
                  <div className="bg-black rounded-lg p-6">
                    <App 
                      defaultStsConfig={createAgentStsConfig(selectedAgent)}
                      onMessageEvent={() => {}}
                      requiresUserActionToInitialize={false}
                    />
                  </div>

                  {/* Session Controls */}
                  <div className="flex justify-center space-x-4 mt-6">
                    <button
                      onClick={endSession}
                      className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <Square className="w-5 h-5" />
                      <span>End Session</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Session Analytics Panel */}
              <div className="space-y-6">
                {/* Session Info */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="font-semibold mb-4 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Session Info</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration</span>
                      <span className="font-mono">{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coach</span>
                      <span>{selectedAgent?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="text-green-400">Active</span>
                    </div>
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="font-semibold mb-4">Quick Tips</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Speak clearly and at a natural pace</li>
                    <li>• Use the pause button if you need a moment</li>
                    <li>• Practice active listening</li>
                    <li>• Don&apos;t be afraid to make mistakes</li>
                  </ul>
                </div>

                {/* Real-time Feedback Placeholder */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="font-semibold mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Live Feedback</span>
                  </h3>
                  <div className="text-center py-4 text-gray-400">
                    <p className="text-sm">Real-time analysis will appear here during conversation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading session...</div>
      </div>
    }>
      <SessionPageContent />
    </Suspense>
  );
}
