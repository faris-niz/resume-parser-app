# Resume Parser

AI-powered web application that analyzes resumes and extracts structured information.

## Features

-  Drag & drop file upload (PDF and TXT)
-  AI-powered parsing with Google Gemini
-  Extracts name, role, skills, experience, and education
-  Modern, responsive UI with animations
-  Real-time processing status

## Quick Start

**Prerequisites:** Node.js 18+, Gemini API key

1. Install dependencies:
npm install

2. Create `.env.local` file:
GEMINI_API_KEY=your-key-here
```

3. Run development server:
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Framer Motion
- **Backend:** Next.js API Routes
- **AI:** Google Gemini
- **Styling:** CSS Modules

## API Endpoints

### POST `/api/resumes/upload`
Upload resume file (multipart/form-data)

### GET `/api/resumes/:id/summary`
Get parsed resume data

Add `GEMINI_API_KEY` in environment variables.

## Troubleshooting

- **API key error:** Create `.env.local` with your Gemini API key
- **Port in use:** Run `PORT=3001 npm run dev`
- **PDF parsing fails:** Ensure PDF has text (not scanned image)

## Notes

- In-memory storage (resets on restart)
- PDF and TXT files only
- 10MB file size limit
