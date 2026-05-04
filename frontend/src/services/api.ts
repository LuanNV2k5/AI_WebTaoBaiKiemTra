import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Auto-attach JWT token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string; full_name?: string; role: string }) =>
    api.post('/auth/register', data),
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
};

// ── Questions ─────────────────────────────────────
export const questionsApi = {
  list: (params?: { subject?: string; grade?: number; chapter?: number; knowledge_type?: string; difficulty?: number }) =>
    api.get('/questions', { params }),
  create: (data: object) => api.post('/questions', data),
  update: (id: number, data: object) => api.put(`/questions/${id}`, data),
  delete: (id: number) => api.delete(`/questions/${id}`),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/questions/upload', formData);
  }
};

// ── Exams ─────────────────────────────────────────
export const examsApi = {
  list: (params?: { grade?: number }) => api.get('/exams', { params }),
  get: (id: number) => api.get(`/exams/${id}`),
  generate: (data: object) => api.post('/exams/generate', data),
  generateAI: (data: object) => api.post('/exams/generate-ai', data, { timeout: 60000 }),
  createManual: (data: object) => api.post('/exams/manual', data),
  update: (id: number, data: object) => api.put(`/exams/${id}`, data),
  delete: (id: number) => api.delete(`/exams/${id}`),
};

// ── Submissions ───────────────────────────────────
export const submissionsApi = {
  list: () => api.get('/submissions'),
  get: (id: number) => api.get(`/submissions/${id}`),
  getByExam: (examId: number) => api.get(`/submissions/exam/${examId}`),
  submit: (data: { exam_id: number; answers: Record<string, string>; time_spent: number }) =>
    api.post('/submissions', data),
};

// ── Analytics ─────────────────────────────────────
export const analyticsApi = {
  getMyAnalytics: () => api.get('/analytics/me'),
  getStudentAnalytics: (id: number) => api.get(`/analytics/student/${id}`),
};

// ── Users ─────────────────────────────────────────
export const usersApi = {
  getStudents: () => api.get('/users/students'),
  createStudent: (data: any) => api.post('/users/students', data),
  updateStudent: (id: number, data: any) => api.put(`/users/students/${id}`, data),
  deleteStudent: (id: number) => api.delete(`/users/students/${id}`),
  uploadStudents: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/students/upload', formData);
  }
};

// ── Knowledge Types ──────────────────────────────
export const knowledgeTypesApi = {
  list: () => api.get('/knowledge-types'),
  create: (name: string) => api.post('/knowledge-types', { name }),
  update: (id: number, name: string) => api.put(`/knowledge-types/${id}`, { name }),
  delete: (id: number) => api.delete(`/knowledge-types/${id}`),
};

export default api;
