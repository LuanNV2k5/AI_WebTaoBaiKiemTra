// TypeScript types cho toàn bộ app

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'student' | 'admin';
  grade?: number;
  created_at: string;
}

export interface Question {
  id: number;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
  subject: string;
  grade: number;
  chapter: number;
  lesson: number;
  chapter_name?: string;
  knowledge_type: 'concept' | 'theorem' | 'property' | 'exercise';
  difficulty: 1 | 2 | 3;
  time_estimate: number;
  created_by?: number;
  created_at: string;
}

export interface Exam {
  id: number;
  title: string;
  subject: string;
  grade: number;
  description?: string;
  time_limit: number;
  total_questions: number;
  is_published: boolean;
  created_by?: number;
  created_at: string;
  questions: Question[];
}

export interface ExamListItem {
  id: number;
  title: string;
  subject: string;
  grade: number;
  time_limit: number;
  total_questions: number;
  created_at: string;
}

export interface SubmissionDetail {
  question_id: number;
  user_answer?: string;
  is_correct: boolean;
  question: Question;
}

export interface Submission {
  id: number;
  user_id: number;
  exam_id: number;
  score: number;
  time_spent: number;
  ai_feedback?: string;
  submitted_at: string;
  details: SubmissionDetail[];
}

export interface SubmissionListItem {
  id: number;
  exam_id: number;
  score: number;
  time_spent: number;
  submitted_at: string;
}

export interface KnowledgeStats {
  knowledge_type: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface ChapterStats {
  chapter: number;
  chapter_name?: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface StudentAnalytics {
  user_id: number;
  username: string;
  total_exams: number;
  avg_score: number;
  best_score: number;
  worst_score: number;
  knowledge_stats: KnowledgeStats[];
  chapter_stats: ChapterStats[];
  score_trend: { date: string; score: number; exam_id: number }[];
  multi_exam_feedback?: string;
}

export interface ExamGenerateRequest {
  title: string;
  subject: string;
  grade: number;
  chapters?: number[];
  knowledge_types?: string[];
  total_questions: number;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  time_limit: number;
}
