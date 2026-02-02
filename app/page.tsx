'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';
import { s } from 'framer-motion/client';

interface UploadResponse {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
}

interface ResumeSummary {
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

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ResumeSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only PDF and TXT files are allowed.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB.';
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    const validationError = validateFile(droppedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(droppedFile);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
  }, []);

  const pollSummary = async (id: string) => {
    setIsProcessing(true);
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/resumes/${id}/summary`);
        
        if (response.status === 202) {
          // Still processing
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000);
          } else {
            setError('Processing timeout. Please try again.');
            setIsProcessing(false);
            setIsUploading(false);
          }
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }

        const data = await response.json();
        setSummary(data);
        setIsProcessing(false);
        setIsUploading(false);
      } catch (err) {
        setError('Failed to retrieve resume summary');
        setIsProcessing(false);
        setIsUploading(false);
      }
    };

    poll();
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data: UploadResponse = await response.json();
      setResumeId(data.id);

      // Start polling for summary
      console.log('Starting to poll for summary of resume ID:', data.id);
      await pollSummary(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setResumeId(null);
    setSummary(null);
    setIsUploading(false);
    setIsProcessing(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={styles.container}>
      <motion.header 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className={styles.title}>
          <span className={styles.titleGradient}>RESUME</span>
          <span className={styles.titleOutline}>PARSER</span>
        </h1>
        <p className={styles.subtitle}>AI-Powered Resume Analysis</p>
      </motion.header>

      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {!summary ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className={styles.uploadSection}
            >
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="fileInput"
                  className={styles.fileInput}
                  accept=".pdf,.txt"
                  onChange={handleFileInput}
                  disabled={isUploading}
                />
                
                <label htmlFor="fileInput" className={styles.dropzoneLabel}>
                  <motion.div
                    className={styles.uploadIcon}
                    animate={{ 
                      y: isDragging ? -10 : 0,
                      scale: isDragging ? 1.1 : 1 
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 18C4.23858 18 2 15.7614 2 13C2 10.2386 4.23858 8 7 8C7.35064 8 7.69479 8.02764 8.03114 8.08077M7 18C7 15.2386 9.23858 13 12 13C14.7614 13 17 15.2386 17 18M7 18H17M17 18C19.7614 18 22 15.7614 22 13C22 10.2386 19.7614 8 17 8C16.6494 8 16.3052 8.02764 15.9689 8.08077M12 2L12 9M12 2L9 5M12 2L15 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>

                  <h2 className={styles.dropzoneTitle}>
                    {isDragging ? 'Drop your resume here' : 'Drag & drop your resume'}
                  </h2>
                  <p className={styles.dropzoneText}>or click to browse</p>
                  <p className={styles.dropzoneHint}>Supports PDF and TXT files</p>
                </label>
              </div>

              {file && !isUploading && (
                <motion.div
                  className={styles.fileInfo}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={styles.fileDetails}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div>
                      <p className={styles.fileName}>{file.name}</p>
                      <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className={styles.fileActions}>
                    <button onClick={handleUpload} className={styles.uploadButton}>
                      Parse Resume
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M14 5L21 12M21 12L14 19M21 12H3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button onClick={handleReset} className={styles.cancelButton}>
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}

              {isUploading && (
                <motion.div
                  className={styles.loadingState}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className={styles.loader}>
                    <div className={styles.loaderRing}></div>
                    <div className={styles.loaderRing}></div>
                    <div className={styles.loaderRing}></div>
                  </div>
                  <p className={styles.loadingText}>
                    {isProcessing ? 'Analyzing resume with AI...' : 'Uploading...'}
                  </p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  className={styles.error}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {error}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={styles.summarySection}
            >
              <div className={styles.summaryHeader}>
                <h2 className={styles.summaryTitle}>Resume Analysis</h2>
                <button onClick={handleReset} className={styles.newAnalysisButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  New Analysis
                </button>
              </div>

              <div className={styles.summaryGrid}>
                <motion.div
                  className={styles.summaryCard}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className={styles.cardHeader}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3>Profile</h3>
                  </div>
                  <div className={styles.cardContent}>
                    <p className={styles.primaryText}>{summary.name}</p>
                    <p className={styles.secondaryText}>{summary.currentRole}</p>
                    <p className={styles.tertiaryText}>
                      {summary.experienceYears} {summary.experienceYears === 1 ? 'year' : 'years'} of experience
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className={styles.summaryCard}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className={styles.cardHeader}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9.663 17H12M3 21V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V21L17.5 19L14.5 21L11.5 19L8.5 21L5.5 19L3 21Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3>Education</h3>
                  </div>
                  <div className={styles.cardContent}>
                    {summary.education.map((edu, index) => (
                      <div key={index} className={styles.educationItem}>
                        <p className={styles.primaryText}>{edu.degree}</p>
                        <p className={styles.secondaryText}>{edu.institution}</p>
                        <p className={styles.tertiaryText}>{edu.graduationYear}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className={`${styles.summaryCard} ${styles.skillsCard}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={styles.cardHeader}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M13 10V3L4 14H11L11 21L20 10L13 10Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3>Skills</h3>
                  </div>
                  <div className={styles.skillsGrid}>
                    {summary.skills.map((skill, index) => (
                      <motion.span
                        key={index}
                        className={styles.skillTag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className={`${styles.summaryCard} ${styles.summaryTextCard}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className={styles.cardHeader}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3>Professional Summary</h3>
                  </div>
                  <div className={styles.cardContent}>
                    <p className={styles.summaryParagraph}>{summary.summary}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
