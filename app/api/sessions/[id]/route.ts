import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { createServiceClient } from '../../../utils/supabase/service';
import { getSession, updateSession } from '../../../lib/database';

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

    const session = await getSession(params.id, createServiceClient());
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user owns this session
    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
    const { status, duration_seconds, title, session_metadata } = body;

    // First verify the session belongs to the user
    const existingSession = await getSession(params.id, createServiceClient());
    if (!existingSession || existingSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (duration_seconds !== undefined) updates.duration_seconds = duration_seconds;
    if (title !== undefined) updates.title = title;
    if (session_metadata !== undefined) updates.session_metadata = session_metadata;

    const updatedSession = await updateSession(params.id, updates, createServiceClient());
    
    if (!updatedSession) {
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
