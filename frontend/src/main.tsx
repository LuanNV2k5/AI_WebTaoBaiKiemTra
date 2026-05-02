import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ExamsPage from './pages/ExamsPage';
import TakeExamPage from './pages/TakeExamPage';
import ResultPage from './pages/ResultPage';
import DashboardPage from './pages/DashboardPage';
import CreateExamPage from './pages/CreateExamPage';
import QuestionBankPage from './pages/QuestionBankPage';
import StudentsPage from './pages/StudentsPage';
import KnowledgeTypesPage from './pages/KnowledgeTypesPage';
import './index.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/exams" replace />;
}

function AppLayout() {
  const { token } = useAuth();
  return (
    <>
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/exams" replace />} />
        <Route path="/exams" element={<PrivateRoute><ExamsPage /></PrivateRoute>} />
        <Route path="/exam/:id" element={<PrivateRoute><TakeExamPage /></PrivateRoute>} />
        <Route path="/result/:id" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/create-exam" element={<PrivateRoute><AdminRoute><CreateExamPage /></AdminRoute></PrivateRoute>} />
        <Route path="/question-bank" element={<PrivateRoute><AdminRoute><QuestionBankPage /></AdminRoute></PrivateRoute>} />
        <Route path="/students" element={<PrivateRoute><AdminRoute><StudentsPage /></AdminRoute></PrivateRoute>} />
        <Route path="/students/:id" element={<PrivateRoute><AdminRoute><DashboardPage /></AdminRoute></PrivateRoute>} />
        <Route path="/knowledge-types" element={<PrivateRoute><AdminRoute><KnowledgeTypesPage /></AdminRoute></PrivateRoute>} />
      </Routes>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
