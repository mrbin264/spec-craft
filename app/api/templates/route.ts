// API route for spec templates
import { NextRequest, NextResponse } from 'next/server';
import { getAllTemplates } from '../../../lib/templates';

/**
 * GET /api/templates
 * Returns all available spec templates
 */
export async function GET(request: NextRequest) {
  try {
    const templates = getAllTemplates();
    
    return NextResponse.json({
      templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch templates',
        },
      },
      { status: 500 }
    );
  }
}
