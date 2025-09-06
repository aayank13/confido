import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { createServiceClient } from '../../../utils/supabase/service';
import { getCustomAgentById, updateCustomAgent, deleteCustomAgent } from '../../../lib/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const agent = await getCustomAgentById(params.id, serviceClient);
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if user owns this agent
    if (agent.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const serviceClient = createServiceClient();
    
    // First check if agent exists and user owns it
    const existingAgent = await getCustomAgentById(params.id, serviceClient);
    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    if (existingAgent.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = {
      name,
      description: description || null,
      system_prompt,
      voice_model: voice_model || 'aura-asteria-en',
      personality_traits: personality_traits || {},
      is_public: is_public || false,
      updated_at: new Date().toISOString()
    };

    const updatedAgent = await updateCustomAgent(params.id, updateData, serviceClient);
    
    if (!updatedAgent) {
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }

    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    
    // First check if agent exists and user owns it
    const existingAgent = await getCustomAgentById(params.id, serviceClient);
    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    if (existingAgent.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await deleteCustomAgent(params.id, serviceClient);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
