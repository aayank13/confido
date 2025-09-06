import { createClient } from '../utils/supabase/server';
import { createServiceClient } from '../utils/supabase/service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { 
  Profile, 
  CustomAgent, 
  Session, 
  SessionWithAnalytics, 
  UserProgress, 
  Goal,
  SessionAnalytics,
  SessionSummary,
  Transcript
} from './types';

// Profile operations
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return data;
}

// Custom agent operations
export async function getCustomAgents(userId: string, supabase?: SupabaseClient): Promise<CustomAgent[]> {
  const client = supabase || createClient();
  const { data, error } = await client
    .from('custom_agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching custom agents:', error);
    return [];
  }
  
  return data || [];
}

export async function getPublicAgents(limit = 20, supabase?: SupabaseClient): Promise<CustomAgent[]> {
  // For public agents, use service client to bypass RLS if no authenticated client provided
  const client = supabase || createServiceClient();
  const { data, error } = await client
    .from('custom_agents')
    .select('*') // Simplified to avoid join issues with profiles
    .eq('is_public', true)
    .order('usage_count', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching public agents:', error);
    return [];
  }
  
  return data || [];
}

export async function getFeaturedAgents(supabase?: SupabaseClient): Promise<CustomAgent[]> {
  // For featured agents, use the provided client or create a new one
  const client = supabase || createClient();
  
  const { data, error } = await client
    .from('custom_agents')
    .select('*')
    .eq('is_featured', true)
    .eq('is_public', true)
    .order('usage_count', { ascending: false });
  
  if (error) {
    console.error('Error fetching featured agents:', error);
    return [];
  }
  
  return data || [];
}

export async function createCustomAgent(agent: Omit<CustomAgent, 'id' | 'created_at' | 'updated_at' | 'usage_count'>, supabase?: SupabaseClient): Promise<CustomAgent | null> {
  const client = supabase || createClient();
  const { data, error } = await client
    .from('custom_agents')
    .insert(agent)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating custom agent:', error);
    return null;
  }
  
  return data;
}

export async function updateCustomAgent(agentId: string, updates: Partial<CustomAgent>, supabase?: SupabaseClient): Promise<CustomAgent | null> {
  const client = supabase || createClient();
  const { data, error } = await client
    .from('custom_agents')
    .update(updates)
    .eq('id', agentId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating custom agent:', error);
    return null;
  }
  
  return data;
}

export async function getCustomAgentById(agentId: string, supabase?: SupabaseClient): Promise<CustomAgent | null> {
  const client = supabase || createClient();
  const { data, error } = await client
    .from('custom_agents')
    .select('*')
    .eq('id', agentId)
    .single();
  
  if (error) {
    console.error('Error fetching custom agent by ID:', error);
    return null;
  }
  
  return data;
}

export async function deleteCustomAgent(agentId: string, supabase?: SupabaseClient): Promise<boolean> {
  const client = supabase || createClient();
  const { error } = await client
    .from('custom_agents')
    .delete()
    .eq('id', agentId);
  
  if (error) {
    console.error('Error deleting custom agent:', error);
    return false;
  }
  
  return true;
}

export async function incrementAgentUsage(agentId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .rpc('increment_agent_usage', { agent_id: agentId });
  
  if (error) {
    console.error('Error incrementing agent usage:', error);
  }
}

// Session operations
export async function createSession(session: Omit<Session, 'id' | 'created_at' | 'updated_at'>, supabase?: SupabaseClient): Promise<Session | null> {
  const client = supabase || createClient();
  const { data, error } = await client
    .from('sessions')
    .insert(session)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating session:', error);
    return null;
  }
  
  return data;
}

export async function getSessionsWithAnalytics(userId: string, limit = 50): Promise<SessionWithAnalytics[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_analytics(*),
      session_summaries(*),
      custom_agents(name, description)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  
  return data || [];
}

export async function getSession(sessionId: string, supabase?: SupabaseClient): Promise<SessionWithAnalytics | null> {
  const client = supabase || createClient();
  const { data, error } = await client
    .from('sessions')
    .select(`
      *,
      session_analytics(*),
      session_summaries(*),
      custom_agents(name, description, system_prompt)
    `)
    .eq('id', sessionId)
    .single();
  
  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  
  return data;
}

export async function updateSession(sessionId: string, updates: Partial<Session>, supabase?: SupabaseClient): Promise<Session | null> {
  const client = supabase || createClient();
  const { data, error } = await client
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating session:', error);
    return null;
  }
  
  return data;
}

// Transcript operations
export async function addTranscript(transcript: Omit<Transcript, 'id' | 'created_at'>): Promise<Transcript | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transcripts')
    .insert(transcript)
    .select()
    .single();
  
  if (error) {
    console.error('Error adding transcript:', error);
    return null;
  }
  
  return data;
}

export async function getSessionTranscripts(sessionId: string): Promise<Transcript[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp_ms', { ascending: true });
  
  if (error) {
    console.error('Error fetching transcripts:', error);
    return [];
  }
  
  return data || [];
}

// Analytics operations
export async function saveSessionAnalytics(analytics: Omit<SessionAnalytics, 'id' | 'created_at'>): Promise<SessionAnalytics | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('session_analytics')
    .insert(analytics)
    .select()
    .single();
  
  if (error) {
    console.error('Error saving session analytics:', error);
    return null;
  }
  
  return data;
}

export async function saveSessionSummary(summary: Omit<SessionSummary, 'id' | 'created_at'>): Promise<SessionSummary | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('session_summaries')
    .insert(summary)
    .select()
    .single();
  
  if (error) {
    console.error('Error saving session summary:', error);
    return null;
  }
  
  return data;
}

// Progress tracking
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
  
  return data || [];
}

export async function updateUserProgress(userId: string, skillArea: string, progressData: Partial<UserProgress>): Promise<UserProgress | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      skill_area: skillArea,
      ...progressData
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user progress:', error);
    return null;
  }
  
  return data;
}

// Goals operations
export async function getUserGoals(userId: string): Promise<Goal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
  
  return data || [];
}

export async function createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .insert(goal)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating goal:', error);
    return null;
  }
  
  return data;
}

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating goal:', error);
    return null;
  }
  
  return data;
}
