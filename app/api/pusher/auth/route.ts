import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socket_id, channel_name } = body;
    
    // Add authentication logic here if needed
    // For public channels, you can skip authentication
    const authResponse = pusherServer.authorizeChannel(socket_id, channel_name);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}