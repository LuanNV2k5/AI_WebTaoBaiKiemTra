import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsApi, questionsApi, knowledgeTypesApi } from '../services/api';

const CHAPTERS = Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Chương ${i + 1}` }));

export default function CreateExamPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [loading, setLoading] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [qSearch, setQSearch] = useState({ grade: 10, chapter: null as number | null });
  const [ktOptions, setKtOptions] = useState<{ id: number; name: string }[]>([]);

  const [form, setForm] = useState({
    title: '',
    subject: 'Toán',
    grade: 10,
    chapters: [] as number[],
    knowledge_types: [] as string[],
    total_questions: 20,
    difficulty_distribution: { easy: 40, medium: 40, hard: 20 },
    time_limit: 30,
  });

  const loadQuestions = async () => {
    try {
      const res = await questionsApi.list({ grade: qSearch.grade, chapter: qSearch.chapter || undefined });
      setAvailableQuestions(res.data);
    } catch (err) { alert("Lỗi tải ngân hàng câu hỏi"); }
  };

  React.useEffect(() => {
    if (mode === 'manual') loadQuestions();
  }, [mode, qSearch]);

  React.useEffect(() => {
    knowledgeTypesApi.list().then(r => setKtOptions(r.data));
  }, []);

  const toggleChapter = (ch: number) => setForm(f => ({
    ...f, chapters: f.chapters.includes(ch) ? f.chapters.filter(c => c !== ch) : [...f.chapters, ch]
  }));
  const toggleKT = (kt: string) => setForm(f => ({
    ...f, knowledge_types: f.knowledge_types.includes(kt) ? f.knowledge_types.filter(k => k !== kt) : [...f.knowledge_types, kt]
  }));
  const setDiff = (k: string, v: number) => setForm(f => {
    const d = { ...f.difficulty_distribution, [k]: v };
    return { ...f, difficulty_distribution: d };
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('Vui lòng nhập tên đề thi');
    setLoading(true);
    try {
      if (mode === 'auto') {
        const payload = { ...form, chapters: form.chapters.length ? form.chapters : undefined, knowledge_types: form.knowledge_types.length ? form.knowledge_types : undefined };
        const res = await examsApi.generate(payload);
        alert(`✅ Tạo đề thành công: ${res.data.total_questions} câu hỏi!`);
      } else {
        if (selectedQuestionIds.length === 0) return alert("Vui lòng chọn ít nhất 1 câu hỏi");
        await examsApi.createManual({
          title: form.title,
          grade: form.grade,
          time_limit: form.time_limit,
          question_ids: selectedQuestionIds
        });
        alert(`✅ Đã tạo đề thi thủ công thành công!`);
      }
      navigate('/exams');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Tạo đề thất bại');
    } finally { setLoading(false); }
  };

  const toggleQuestion = (id: number) => {
    setSelectedQuestionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalDiff = form.difficulty_distribution.easy + form.difficulty_distribution.medium + form.difficulty_distribution.hard;

  return (
    <div className="page fade-in" style={{ maxWidth: 800 }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>⚡ {mode === 'auto' ? 'Tạo đề tự động' : 'Tạo đề thủ công'}</h1>
          <p className="text-secondary">{mode === 'auto' ? 'Thuật toán di truyền sẽ tối ưu bộ câu hỏi' : 'Tự tay chọn lọc từng câu hỏi từ ngân hàng'}</p>
        </div>
        <div className="flex gap-2">
          <button className={`btn ${mode === 'auto' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('auto')}>[Tự động]</button>
          <button className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('manual')}>[Thủ công]</button>
        </div>
      </div>

      <form onSubmit={handleGenerate}>
        {/* Basic info */}
        <div className="card mb-3">
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            [Cài đặt] Thông tin cơ bản
          </h3>
          <div className="form-group">
            <label className="form-label">Tên đề thi *</label>
            <input className="form-input" placeholder="VD: Kiểm tra 15 phút Chương 1-2" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Khối lớp</label>
              <select className="form-input" value={form.grade} onChange={e => {
                const g = Number(e.target.value);
                setForm(f => ({ ...f, grade: g }));
                setQSearch(qs => ({ ...qs, grade: g }));
              }}>
                <option value={10}>Khối 10</option>
                <option value={11}>Khối 11</option>
                <option value={12}>Khối 12</option>
              </select>
            </div>
            {mode === 'auto' && (
              <div className="form-group">
                <label className="form-label">Số câu hỏi</label>
                <input className="form-input" type="number" min={5} max={60} value={form.total_questions} onChange={e => setForm(f => ({ ...f, total_questions: Number(e.target.value) }))} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Thời gian (phút)</label>
              <input className="form-input" type="number" min={5} max={180} value={form.time_limit} onChange={e => setForm(f => ({ ...f, time_limit: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        {mode === 'auto' ? (
          <>
            {/* Chapters */}
            <div className="card mb-3">
              <h3 style={{ marginBottom: '1rem' }}>📚 Chọn chương (bỏ trống = tất cả)</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {CHAPTERS.map(ch => (
                  <button type="button" key={ch.value} onClick={() => toggleChapter(ch.value)}
                    className={`btn btn-sm ${form.chapters.includes(ch.value) ? 'btn-primary' : 'btn-secondary'}`}>
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge types */}
            <div className="card mb-3">
              <h3 style={{ marginBottom: '1rem' }}>🧠 Loại kiến thức (bỏ trống = tất cả)</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ktOptions.map(kt => (
                  <button type="button" key={kt.id} onClick={() => toggleKT(kt.name)}
                    className={`btn btn-sm ${form.knowledge_types.includes(kt.name) ? 'btn-primary' : 'btn-secondary'}`}>
                    {kt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="card mb-3">
              <h3 style={{ marginBottom: '1rem' }}>🎯 Phân bổ độ khó (tổng = {totalDiff}%)</h3>
              {totalDiff !== 100 && <div className="alert alert-warning" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Tổng phải bằng 100%</div>}
              {[['easy', 'Dễ', 'var(--success)'], ['medium', 'Trung bình', 'var(--warning)'], ['hard', 'Khó', 'var(--danger)']].map(([k, label, color]) => (
                <div key={k} style={{ marginBottom: '1rem' }}>
                  <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0, color: color as string }}>{label}</label>
                    <strong style={{ color: color as string }}>{form.difficulty_distribution[k as keyof typeof form.difficulty_distribution]}%</strong>
                  </div>
                  <input type="range" min={0} max={100} value={form.difficulty_distribution[k as keyof typeof form.difficulty_distribution]}
                    onChange={e => setDiff(k, Number(e.target.value))}
                    style={{ width: '100%', accentColor: color as string }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card mb-3">
            <div className="flex-between mb-3">
              <h3>🏦 Ngân hàng câu hỏi (Đã chọn: {selectedQuestionIds.length})</h3>
              <div className="flex gap-2">
                <select className="form-input btn-sm" value={qSearch.chapter || ''} onChange={e => setQSearch({...qSearch, chapter: e.target.value ? Number(e.target.value) : null})}>
                  <option value="">Tất cả chương</option>
                  {CHAPTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              {availableQuestions.length === 0 ? (
                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy câu hỏi phù hợp.</p>
              ) : (
                <table className="table" style={{ fontSize: '0.9rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                    <tr>
                      <th style={{ width: '40px' }}>Chọn</th>
                      <th>Nội dung</th>
                      <th style={{ width: '100px' }}>Độ khó</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableQuestions.map(q => (
                      <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => toggleQuestion(q.id)}>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={selectedQuestionIds.includes(q.id)} readOnly />
                        </td>
                        <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.content}</td>
                        <td>
                          <span className={`badge ${q.difficulty === 1 ? 'badge-success' : q.difficulty === 2 ? 'badge-warning' : 'badge-danger'}`}>
                            {q.difficulty === 1 ? 'Dễ' : q.difficulty === 2 ? 'Trung bình' : 'Khó'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || (mode === 'auto' && totalDiff !== 100) || (mode === 'manual' && selectedQuestionIds.length === 0)}>
          {loading ? 'Đang tạo đề...' : mode === 'auto' ? '[Tạo đề tự động với AI]' : '[Lưu đề thi thủ công]'}
        </button>
      </form>
    </div>
  );
}
