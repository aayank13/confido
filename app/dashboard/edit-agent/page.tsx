/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { 
  ArrowLeft, 
  Save, 
  Bot, 
  MessageSquare, 
  Volume2,
  Lightbulb,
  Eye,
  Share2
} from 'lucide-react';

interface CustomAgent {
  id?: string;
  name: string;
  description: string;
  system_prompt: string;
  voice_model: string;
  personality_traits: Record<string, unknown>;
  is_public: boolean;
  user_id?: string;
}

const VOICE_OPTIONS = [
  { id: 'aura-luna-en', name: 'Luna (Friendly Female)', description: 'Warm and encouraging' },
  { id: 'aura-stella-en', name: 'Stella (Professional Female)', description: 'Clear and confident' },
  { id: 'aura-athena-en', name: 'Athena (Authoritative Female)', description: 'Strong and direct' },
  { id: 'aura-hera-en', name: 'Hera (Mature Female)', description: 'Wise and experienced' },
  { id: 'aura-orion-en', name: 'Orion (Professional Male)', description: 'Calm and articulate' },
  { id: 'aura-arcas-en', name: 'Arcas (Friendly Male)', description: 'Enthusiastic and supportive' },
  { id: 'aura-perseus-en', name: 'Perseus (Authoritative Male)', description: 'Confident and commanding' },
  { id: 'aura-angus-en', name: 'Angus (Casual Male)', description: 'Relaxed and approachable' },
];

export default function EditAgentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <EditAgentContent />
    </Suspense>
  );
}

function EditAgentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<CustomAgent>({
    name: '',
    description: '',
    system_prompt: '',
    voice_model: 'aura-luna-en',
    personality_traits: {},
    is_public: false,
  });

  useEffect(() => {
    const loadAgent = async (id: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(`/api/agents/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const agentData = await response.json();
          setAgent(agentData);
        } else {
          console.error('Failed to load agent');
          router.push('/dashboard/session');
        }
      } catch (error) {
        console.error('Error loading agent:', error);
        router.push('/dashboard/session');
      }
    };

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      if (agentId) {
        await loadAgent(agentId);
      }
      
      setLoading(false);
    };

    getUser();
  }, [router, supabase.auth, agentId]);

  const handleSave = async () => {
    if (!agent.name.trim() || !agent.system_prompt.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: agent.name.trim(),
          description: agent.description.trim(),
          system_prompt: agent.system_prompt.trim(),
          voice_model: agent.voice_model,
          personality_traits: agent.personality_traits,
          is_public: agent.is_public,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/session');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('Failed to update agent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading agent...</div>
      </div>
    );
  }

  if (!agentId) {
    router.push('/dashboard/session');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/session')}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold">Confido</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Edit AI Coach</h1>
            <p className="text-gray-400">Modify your custom AI coaching agent</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <span>Agent Name *</span>
                </label>
                <input
                  type="text"
                  value={agent.name}
                  onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                  placeholder="e.g., Interview Coach, Public Speaking Mentor"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Description</span>
                </label>
                <textarea
                  value={agent.description}
                  onChange={(e) => setAgent({ ...agent, description: e.target.value })}
                  placeholder="Brief description of what this agent helps with..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Voice Selection */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center space-x-2">
                  <Volume2 className="w-4 h-4" />
                  <span>Voice</span>
                </label>
                <select
                  value={agent.voice_model}
                  onChange={(e) => setAgent({ ...agent, voice_model: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {VOICE_OPTIONS.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} - {voice.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Visibility</span>
                </h3>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={agent.is_public}
                    onChange={(e) => setAgent({ ...agent, is_public: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_public" className="flex items-center space-x-2 text-sm">
                    <Share2 className="w-4 h-4" />
                    <span>Make this agent public (others can use it)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - AI Instructions */}
            <div className="space-y-6">
              {/* System Prompt */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>AI Instructions *</span>
                </label>
                <textarea
                  value={agent.system_prompt}
                  onChange={(e) => setAgent({ ...agent, system_prompt: e.target.value })}
                  placeholder="Describe how the AI should behave, what role it should take, and how it should help users..."
                  rows={12}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Be specific about the AI&apos;s role, communication style, and objectives. This is the most important part of your agent.
                </p>
              </div>

              {/* Tips */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <h4 className="font-medium mb-2 text-yellow-400">💡 Tips for Great AI Instructions:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Be specific about the AI&apos;s expertise and role</li>
                  <li>• Define the communication style (formal, casual, encouraging)</li>
                  <li>• Specify what the AI should focus on</li>
                  <li>• Include any specific methodologies or approaches</li>
                  <li>• Set boundaries for what the AI should/shouldn&apos;t do</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
