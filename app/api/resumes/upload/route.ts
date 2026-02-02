import { NextRequest, NextResponse } from 'next/server';
import { resumeStore } from '@/lib/storage';
import { extractTextFromPDF, extractTextFromTXT } from '@/lib/parser';
import { parseResumeWithAI } from '@/lib/ai-agent';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and TXT files are allowed.' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = `resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create resume record
    const resume = {
      id,
      fileName: file.name,
      uploadDate: new Date().toISOString(),
      status: 'processing' as const,
    };

    // Store resume
    resumeStore.add(resume);

    // Process file asynchronously
    processResume(id, file)

    return NextResponse.json(resume);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

async function processResume(id: string, file: File) {
  try {
    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;

    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(buffer);
    } else {
      text = extractTextFromTXT(buffer);
    }

    // Store the text
    resumeStore.update(id, { text });

    // Parse with AI
    const summary = await parseResumeWithAI(text, id);

    // Update with completed summary
    resumeStore.update(id, {
      status: 'completed',
      summary,
    });
  } catch (error) {
    console.error('Processing error:', error);
    resumeStore.update(id, { status: 'error' });
    throw error;
  }
}
