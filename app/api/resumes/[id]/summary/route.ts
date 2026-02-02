import { NextRequest, NextResponse } from 'next/server';
import { resumeStore } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('Fetching summary for resume ID:', id);
    const resume = resumeStore.get(id);
    console.log('type2', typeof id);
    console.log('keys in store:', Array.from(resumeStore['resumes'].keys()));
    console.log('Retrieved resume:', resume);

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    if (resume.status === 'processing') {
      return NextResponse.json(
        { status: 'processing', message: 'Resume is still being processed' },
        { status: 202 }
      );
    }

    if (resume.status === 'error') {
      return NextResponse.json(
        { error: 'Resume processing failed' },
        { status: 500 }
      );
    }

    if (!resume.summary) {
      return NextResponse.json(
        { error: 'Summary not available' },
        { status: 404 }
      );
    }

    return NextResponse.json(resume.summary);
  } catch (error) {
    console.error('Error retrieving summary:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve summary' },
      { status: 500 }
    );
  }
}
