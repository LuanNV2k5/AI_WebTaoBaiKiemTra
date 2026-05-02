import React, { useEffect, useState } from 'react';
import { questionsApi, knowledgeTypesApi } from '../services/api';
import { Question } from '../types';

const KT_NAMES: Record<string, string> = { concept: 'Khái niệm', theorem: 'Định lý', property: 'Tính chất', exercise: 'Dạng bài tập' };
const DIFF_LABELS: Record<number, string> = { 1: 'Dễ', 2: 'Trung bình', 3: 'Khó' };

const EMPTY_FORM = { content: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', explanation: '', subject: 'Toán', grade: 10, chapter: 1, lesson: 1, chapter_name: '', knowledge_type: 'concept', difficulty: 1, time_estimate: 60 };

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filter, setFilter] = useState({ grade: '', chapter: '', knowledge_type: '', difficulty: '' });
  const [ktOptions, setKtOptions] = useState<{ id: number; name: string }[]>([]);

  const load = () => {
    const params: Record<string, any> = {};
    if (filter.grade) params.grade = Number(filter.grade);
    if (filter.chapter) params.chapter = Number(filter.chapter);
    if (filter.knowledge_type) params.knowledge_type = filter.knowledge_type;
    if (filter.difficulty) params.difficulty = Number(filter.difficulty);
    questionsApi.list(params).then(r => setQuestions(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    knowledgeTypesApi.list().then(r => setKtOptions(r.data));
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await questionsApi.update(editId, form);
        alert('Cập nhật câu hỏi thành công!');
      } else {
        await questionsApi.create(form);
        alert('Thêm câu hỏi thành công!');
      }
      setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); load();
    } catch (err: any) { alert(err.response?.data?.detail || 'Lỗi!'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    await questionsApi.delete(id);
    alert('Đã xóa'); load();
  };

  const openEdit = (q: Question) => {
    setForm({ content: q.content, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer, explanation: q.explanation || '', subject: q.subject, grade: q.grade, chapter: q.chapter, lesson: q.lesson, chapter_name: q.chapter_name || '', knowledge_type: q.knowledge_type, difficulty: q.difficulty, time_estimate: q.time_estimate });
    setEditId(q.id); setShowForm(true);
  };

  return (
    <>
      <div className="page fade-in">
        <div className="flex-between mb-3">
          <div>
            <h1>🗃️ Ngân hàng câu hỏi</h1>
            <p className="text-secondary mt-1">{questions.length} câu hỏi</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => document.getElementById('excel-upload')?.click()}>
              📥 Nhập từ Excel
            </button>
            <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_FORM }); }}>
              [+] Thêm câu hỏi
            </button>
            <input 
              id="excel-upload" 
              type="file" 
              accept=".xlsx, .xls" 
              style={{ display: 'none' }} 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setLoading(true);
                try {
                  const res = await questionsApi.upload(file);
                  alert(res.data.message);
                  load();
                } catch (err: any) {
                  alert(err.response?.data?.detail || 'Lỗi khi tải file');
                } finally {
                  setLoading(false);
                  e.target.value = '';
                }
              }} 
            />
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-3">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 120 }}>
              <label className="form-label">Khối lớp</label>
              <select className="form-select" value={filter.grade} onChange={e => setFilter(f => ({ ...f, grade: e.target.value }))}>
                <option value="">Tất cả</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
              <label className="form-label">Chương</label>
              <select className="form-select" value={filter.chapter} onChange={e => setFilter(f => ({ ...f, chapter: e.target.value }))}>
                <option value="">Tất cả</option>
                {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>Chương {i + 1}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
              <label className="form-label">Loại kiến thức</label>
              <select className="form-select" value={filter.knowledge_type} onChange={e => setFilter(f => ({ ...f, knowledge_type: e.target.value }))}>
                <option value="">Tất cả</option>
                {ktOptions.map(kt => <option key={kt.id} value={kt.name}>{kt.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 130 }}>
              <label className="form-label">Độ khó</label>
              <select className="form-select" value={filter.difficulty} onChange={e => setFilter(f => ({ ...f, difficulty: e.target.value }))}>
                <option value="">Tất cả</option>
                {Object.entries(DIFF_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Question list */}
        <div className="card">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nội dung câu hỏi</th>
                  <th>Khối</th>
                  <th>Chương</th>
                  <th>Loại KT</th>
                  <th>Độ khó</th>
                  <th>Đáp án</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id}>
                    <td style={{ maxWidth: 320 }}><span className="truncate" style={{ display: 'block' }}>{q.content}</span></td>
                    <td><span className="badge badge-primary">Khối {q.grade || 10}</span></td>
                    <td><span className="badge badge-muted">Ch.{q.chapter}</span></td>
                    <td><span className="badge badge-accent">{q.knowledge_type}</span></td>
                    <td><span className={`badge diff-${q.difficulty}`}>{DIFF_LABELS[q.difficulty]}</span></td>
                    <td><span style={{ fontWeight: 700, color: 'var(--success)' }}>{q.correct_answer}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(q)}>[Sửa]</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>[Xóa]</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-3">
              <h3>{editId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>[X]</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nội dung câu hỏi *</label>
                <textarea className="form-textarea" rows={3} value={form.content} onChange={e => set('content', e.target.value)} required />
              </div>
              {['a', 'b', 'c', 'd'].map(l => (
                <div key={l} className="form-group">
                  <label className="form-label">Đáp án {l.toUpperCase()} *</label>
                  <input className="form-input" value={(form as any)[`option_${l}`]} onChange={e => set(`option_${l}`, e.target.value)} required />
                </div>
              ))}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Đáp án đúng *</label>
                  <select className="form-select" value={form.correct_answer} onChange={e => set('correct_answer', e.target.value)}>
                    {['A', 'B', 'C', 'D'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Loại kiến thức *</label>
                  <select className="form-select" value={form.knowledge_type} onChange={e => set('knowledge_type', e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {ktOptions.map(kt => <option key={kt.id} value={kt.name}>{kt.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Khối lớp *</label>
                  <select className="form-select" value={form.grade} onChange={e => set('grade', Number(e.target.value))}>
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Chương</label>
                  <input className="form-input" type="number" min={1} value={form.chapter} onChange={e => set('chapter', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Độ khó</label>
                  <select className="form-select" value={form.difficulty} onChange={e => set('difficulty', Number(e.target.value))}>
                    {Object.entries(DIFF_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tên chương</label>
                <input className="form-input" value={form.chapter_name} onChange={e => set('chapter_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Giải thích đáp án</label>
                <textarea className="form-textarea" rows={2} value={form.explanation} onChange={e => set('explanation', e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                {editId ? 'Cập nhật' : 'Thêm câu hỏi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
