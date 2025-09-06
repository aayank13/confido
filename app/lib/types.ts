// Database types for Confido platform
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomAgent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  voice_model: string;
  personality_traits: Record<string, unknown>;
  is_public: boolean;
  is_featured: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  agent_type: 'interview' | 'conversation' | 'confidence' | 'networking' | 'custom';
  custom_agent_id: string | null;
  title: string | null;
  duration_seconds: number;
  status: 'active' | 'completed' | 'paused';
  session_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  session_id: string;
  speaker: 'user' | 'assistant';
  content: string;
  timestamp_ms: number;
  confidence_score: number | null;
  created_at: string;
}

export interface SessionAnalytics {
  id: string;
  session_id: string;
  user_speaking_time_ms: number;
  agent_speaking_time_ms: number;
  total_words_user: number;
  total_words_agent: number;
  words_per_minute: number;
  pause_count: number;
  interruption_count: number;
  filler_words_count: number;
  confidence_score: number;
  fluency_score: number;
  pace_score: number;
  analytics_data: Record<string, unknown>;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  skill_area: 'interview' | 'conversation' | 'confidence' | 'networking';
  total_sessions: number;
  total_time_minutes: number;
  average_confidence: number;
  average_fluency: number;
  average_pace: number;
  improvement_score: number;
  last_session_date: string | null;
  milestones_achieved: string[];
  progress_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SessionSummary {
  id: string;
  session_id: string;
  summary: string;
  key_points: string[];
  improvement_suggestions: string[];
  strengths: string[];
  areas_for_improvement: string[];
  overall_rating: number | null;
  ai_feedback: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_metric: 'confidence' | 'fluency' | 'pace' | 'session_count';
  target_value: number;
  current_value: number;
  deadline: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface SessionWithAnalytics extends Session {
  session_analytics?: SessionAnalytics;
  session_summaries?: SessionSummary;
  transcripts?: Transcript[];
  custom_agents?: CustomAgent;
}

export interface AgentWithUsage extends CustomAgent {
  profiles?: { full_name: string; avatar_url: string };
}

// Analytics aggregation types
export interface ProgressInsight {
  skill_area: string;
  sessions_this_week: number;
  sessions_last_week: number;
  average_confidence: number;
  confidence_trend: 'improving' | 'declining' | 'stable';
  total_practice_time: number;
  recent_achievements: string[];
}

export interface SessionMetrics {
  total_sessions: number;
  total_time_minutes: number;
  average_session_duration: number;
  most_used_agent: string;
  confidence_improvement: number;
  fluency_improvement: number;
  pace_improvement: number;
}

// Voice analysis types
export interface VoiceAnalysis {
  speaking_rate: number; // words per minute
  pause_analysis: {
    total_pauses: number;
    average_pause_duration: number;
    longest_pause: number;
  };
  filler_words: {
    count: number;
    words: string[];
    percentage: number;
  };
  volume_analysis: {
    average_volume: number;
    volume_variance: number;
    quiet_segments: number;
  };
  confidence_indicators: {
    voice_stability: number;
    speech_clarity: number;
    hesitation_frequency: number;
  };
}

// Real-time session state
export interface LiveSessionState {
  session_id: string;
  status: 'connecting' | 'active' | 'paused' | 'ended';
  current_speaker: 'user' | 'assistant' | null;
  duration_ms: number;
  transcript_count: number;
  live_metrics: {
    user_speaking_time: number;
    agent_speaking_time: number;
    current_pace: number;
    interruptions: number;
  };
}
