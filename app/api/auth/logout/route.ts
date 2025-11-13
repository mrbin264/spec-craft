// POST /api/auth/logout - User logout endpoint
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // In a JWT-based authentication system, logout is handled client-side
  // by removing the token from storage. This endpoint exists for consistency
  // and can be extended to implement token blacklisting if needed.
  
  return NextResponse.json(
    {
      message: 'Logged out successfully',
    },
    { status: 200 }
  );
}
