import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../utils/supabase/server';
import { createServiceClient } from '../../utils/supabase/service';
import { createSession } from '../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user profile exists
    const serviceClient = createServiceClient();
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      await serviceClient
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          email: user.email,
          provider: user.app_metadata?.provider || 'unknown'
        });
    }

    const body = await request.json();
    const { agent_type, custom_agent_id, title } = body;

    if (!agent_type) {
      return NextResponse.json({ error: 'Agent type is required' }, { status: 400 });
    }

    const sessionData = {
      user_id: user.id,
      agent_type,
      custom_agent_id: custom_agent_id || null,
      title: title || `${agent_type} Session - ${new Date().toLocaleDateString()}`,
      duration_seconds: 0,
      status: 'active' as const,
      session_metadata: {}
    };

    const session = await createSession(sessionData, createServiceClient());
    
    if (!session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    // Use service client for the actual query
    const serviceClient = createServiceClient();
    let query = serviceClient
      .from('sessions')
      .select(`
        *,
        session_analytics(*),
        session_summaries(*),
        custom_agents(name, description)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json(sessions || []);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
