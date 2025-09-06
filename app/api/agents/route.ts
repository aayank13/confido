import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../utils/supabase/server';
import { createServiceClient } from '../../utils/supabase/service';
import { getCustomAgents, getPublicAgents, getFeaturedAgents, createCustomAgent } from '../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'my', 'public', 'featured'
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Allow unauthenticated access to featured and public agents
    if (type === 'featured') {
      const serviceClient = createServiceClient();
      const agents = await getFeaturedAgents(serviceClient);
      return NextResponse.json(agents);
    }
    
    if (type === 'public') {
      const serviceClient = createServiceClient();
      const agents = await getPublicAgents(limit, serviceClient);
      return NextResponse.json(agents);
    }

    // For personal agents, require authentication
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default to user's custom agents - use service client since auth is already verified
    const serviceClient = createServiceClient();
    const agents = await getCustomAgents(user.id, serviceClient);
    return NextResponse.json(agents);

  } catch (error) {
    console.error('Error fetching custom agents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, system_prompt, voice_model, personality_traits, is_public } = body;

    if (!name || !system_prompt) {
      return NextResponse.json({ 
        error: 'Name and system prompt are required' 
      }, { status: 400 });
    }

    const agentData = {
      user_id: user.id,
      name,
      description: description || null,
      system_prompt,
      voice_model: voice_model || 'aura-asteria-en',
      personality_traits: personality_traits || {},
      is_public: is_public || false,
      is_featured: false,
      usage_count: 0
    };

    const agent = await createCustomAgent(agentData, createServiceClient());
    
    if (!agent) {
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error creating custom agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
