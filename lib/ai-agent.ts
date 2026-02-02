import { GoogleGenAI } from '@google/genai';
import { ResumeSummary } from './storage';

const genAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const model = 'gemini-2.5-pro';

export async function parseResumeWithAI(resumeText: string, resumeId: string): Promise<ResumeSummary> {

  const prompt = `Extract and return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with the following information from this resume:

Resume text:
${resumeText}

Return a JSON object with this exact structure:
{
  "name": "Full name of the person",
  "currentRole": "Their current job title or target role",
  "experienceYears": <number of years of professional experience>,
  "skills": ["skill1", "skill2", "skill3", ...],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School/University name",
      "graduationYear": <year as number>
    }
  ],
  "summary": "A 2-3 sentence professional summary"
}

Important:
- Return ONLY the JSON object, no other text
- Use realistic estimates if exact information isn't available
- If a field cannot be determined, use reasonable defaults (e.g., empty arrays, "Not specified", 0)
- Ensure graduationYear is a number, not a string`;

  try {

    const response = await genAi.models.generateContent({
      model: model,
      contents: prompt,
    });

    const content = response.text;

    // Remove markdown code blocks if present
    let jsonString = content!.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\n?/g, '').trim();
    }
    console.log('Extracted JSON string:', jsonString);

    const parsedSummary = JSON.parse(jsonString);
    console.log('Parsed resume summary:', parsedSummary);

    return {
      id: resumeId,
      ...parsedSummary,
    };
  } catch (error) {
    console.error('Error parsing resume with AI:', error);
    throw new Error('Failed to parse resume with AI');
  }
}
