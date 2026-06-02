import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser, createQRToken, generatePIN } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'lecturer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get session and verify lecturer owns it
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .eq('lecturer_id', user.sub)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or not active' },
        { status: 404 }
      );
    }

    // Generate new QR token and PIN
    const qrToken = await createQRToken(session.id, user.sub, session.course_id);
    const pinCode = generatePIN();

    // Update session
    const { data: updated, error: updateError } = await supabaseServer
      .from('sessions')
      .update({
        qr_token: qrToken,
        pin_code: pinCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      qr_token: updated.qr_token,
      pin_code: updated.pin_code,
    });
  } catch (error) {
    console.error('[v0] Refresh session error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
}
