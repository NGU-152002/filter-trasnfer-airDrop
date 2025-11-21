import { NextRequest, NextResponse } from 'next/server';

// Simple endpoint to check current server state
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use GET /api/transfer to see active users',
    instructions: 'This will show you exactly what users are registered right now'
  });
}
