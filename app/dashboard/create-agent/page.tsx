'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { 
  ArrowLeft, 
  Save, 
  Bot, 
  User, 
  MessageSquare, 
  Volume2,
  Lightbulb,
  Eye,
  Share2
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface CustomAgent {
  id?: string;
  name: string;
  description: string;
  system_prompt: string;
  voice_id: string;
  personality_traits: string[];
  is_public: boolean;
  category: string;
  created_by?: string;
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

const CATEGORIES = [
  'Interview Coaching',
  'Public Speaking',
  'Language Learning',
  'Confidence Building',
  'Business Communication',
  'Social Skills',
  'Presentation Skills',
  'Networking',
  'Other'
];

const PERSONALITY_TRAITS = [
  'Encouraging', 'Patient', 'Direct', 'Humorous', 'Professional', 'Casual',
  'Supportive', 'Challenging', 'Empathetic', 'Analytical', 'Creative', 'Structured'
];

export default function CreateAgentPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<CustomAgent>({
    name: '',
    description: '',
    system_prompt: '',
    voice_id: 'aura-luna-en',
    personality_traits: [],
    is_public: false,
    category: 'Interview Coaching'
  });
  
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }
      
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router, supabase.auth]);

  const handleInputChange = (field: keyof CustomAgent, value: string | boolean | string[]) => {
    setAgent(prev => ({ ...prev, [field]: value }));
  };

  const togglePersonalityTrait = (trait: string) => {
    setAgent(prev => ({
      ...prev,
      personality_traits: prev.personality_traits.includes(trait)
        ? prev.personality_traits.filter(t => t !== trait)
        : [...prev.personality_traits, trait]
    }));
  };

  const generateSystemPrompt = () => {
    const traits = agent.personality_traits.join(', ');
    const basePrompt = `You are ${agent.name}, an AI communication coach specializing in ${agent.category.toLowerCase()}. 

Your personality is ${traits.toLowerCase() || 'helpful and professional'}. 

Your role is to help users improve their communication skills through realistic practice scenarios and constructive feedback.

Description: ${agent.description}

Guidelines:
- Engage in natural conversation appropriate to your specialty
- Provide specific, actionable feedback
- Encourage users while pointing out areas for improvement
- Ask follow-up questions to deepen the practice
- Keep responses conversational and supportive

Remember to stay in character and maintain your specified personality throughout the interaction.`;

    setAgent(prev => ({ ...prev, system_prompt: basePrompt }));
  };

  const saveAgent = async () => {
    if (!user || !agent.name.trim() || !agent.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: agent.name.trim(),
          description: agent.description.trim(),
          system_prompt: agent.system_prompt.trim(),
          voice_model: agent.voice_id,
          personality_traits: agent.personality_traits,
          is_public: agent.is_public,
          category: agent.category,
        }),
      });      if (response.ok) {
        const savedAgent = await response.json();
        router.push(`/dashboard?agent_created=${savedAgent.id}`);
      } else {
        alert('Error saving agent. Please try again.');
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Error saving agent. Please try again.');
    } finally {
      setSaving(false);
    }
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

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                previewMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{previewMode ? 'Edit' : 'Preview'}</span>
            </button>
            
            <button
              onClick={saveAgent}
              disabled={saving || !agent.name.trim() || !agent.description.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Agent'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {!previewMode ? (
          // Edit Mode
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Create Custom AI Coach</h1>
              <p className="text-gray-400">Design your perfect communication coaching assistant</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Agent Name *</label>
                  <input
                    type="text"
                    value={agent.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Interview Expert, Confidence Coach"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    value={agent.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of what this coach specializes in..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={agent.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Voice</label>
                  <select
                    value={agent.voice_id}
                    onChange={(e) => handleInputChange('voice_id', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {VOICE_OPTIONS.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Personality Traits</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERSONALITY_TRAITS.map(trait => (
                      <button
                        key={trait}
                        onClick={() => togglePersonalityTrait(trait)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          agent.personality_traits.includes(trait)
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={agent.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_public" className="text-sm flex items-center space-x-2">
                    <Share2 className="w-4 h-4" />
                    <span>Make this agent public (others can use it)</span>
                  </label>
                </div>
              </div>

              {/* System Prompt */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">System Prompt</label>
                    <button
                      onClick={generateSystemPrompt}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs flex items-center space-x-1"
                    >
                      <Lightbulb className="w-3 h-3" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <textarea
                    value={agent.system_prompt}
                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                    placeholder="Enter the system prompt that defines how your AI coach should behave..."
                    rows={20}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Preview Mode
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Agent Preview</h1>
              <p className="text-gray-400">How your agent will appear to users</p>
            </div>

            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-8 h-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <h2 className="text-2xl font-bold">{agent.name || 'Agent Name'}</h2>
                    <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm border border-blue-500/30">
                      {agent.category}
                    </span>
                    {agent.is_public && (
                      <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm border border-green-500/30">
                        Public
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-6">{agent.description || 'Agent description will appear here'}</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center space-x-2">
                        <Volume2 className="w-4 h-4" />
                        <span>Voice</span>
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {VOICE_OPTIONS.find(v => v.id === agent.voice_id)?.name || 'Luna (Friendly Female)'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Personality</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {agent.personality_traits.length > 0 ? (
                          agent.personality_traits.map(trait => (
                            <span key={trait} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
                              {trait}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No traits selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Start Session with {agent.name || 'Agent'}</span>
                    </button>
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
