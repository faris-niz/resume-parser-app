// In-memory storage for resumes
export interface Resume {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
  text?: string;
  summary?: ResumeSummary;
}

export interface ResumeSummary {
  id: string;
  name: string;
  currentRole: string;
  experienceYears: number;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: number;
  }>;
  summary: string;
}

class ResumeStore {
  private resumes: Map<string, Resume> = new Map();

  add(resume: Resume): void {
    this.resumes.set(resume.id, resume);
  }

  get(id: string): Resume | undefined {
    return this.resumes.get(id);
  }

  update(id: string, updates: Partial<Resume>): void {
    const resume = this.resumes.get(id);
    if (resume) {
      this.resumes.set(id, { ...resume, ...updates });
    }
  }

  delete(id: string): void {
    this.resumes.delete(id);
  }
}

// Extend global type (optional but nice)
declare global {
  // eslint-disable-next-line no-var
  var resumeStore: ResumeStore | undefined;
}

export const resumeStore =
  globalThis.resumeStore ?? new ResumeStore();

if (!globalThis.resumeStore) {
  globalThis.resumeStore = resumeStore;
}
