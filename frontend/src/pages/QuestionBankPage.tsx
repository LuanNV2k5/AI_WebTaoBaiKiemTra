import React, { useEffect, useState } from 'react';
import { questionsApi, knowledgeTypesApi } from '../services/api';
import { Question } from '../types';
import '../index.css'; 

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

  // === THÊM STATE PHÂN TRANG ===
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Số câu hỏi mỗi trang

  const load = () => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (filter.grade) params.grade = Number(filter.grade);
    if (filter.chapter) params.chapter = Number(filter.chapter);
    if (filter.knowledge_type) params.knowledge_type = filter.knowledge_type;
    if (filter.difficulty) params.difficulty = Number(filter.difficulty);
    
    questionsApi.list(params).then(r => {
      setQuestions(r.data);
      setCurrentPage(1); // Khi lọc hoặc tải lại, tự động quay về trang 1
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { knowledgeTypesApi.list().then(r => setKtOptions(r.data)); }, []);

  useEffect(() => {
    // @ts-ignore
    if (window.renderMathInElement) {
      // @ts-ignore
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false
      });
    }
  }, [questions, currentPage]);

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

  // === TÍNH TOÁN DỮ LIỆU CỦA TRANG HIỆN TẠI ===
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuestions = questions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(questions.length / itemsPerPage);

  return (
    <>
      <div className="qb-container">
        
        {/* Header */}
        <div className="qb-header">
          <div>
            <h1 className="qb-title">Ngân hàng câu hỏi</h1>
          </div>
          <div className="qb-actions">
            <button className="qb-btn-excel" onClick={() => document.getElementById('excel-upload')?.click()}>
              📥 Nhập từ Excel
            </button>
            <button className="qb-btn-add" onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_FORM }); }}>
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
        <div className="qb-filters">
          <div className="qb-filter-item">
            <label className="form-label-navy">Khối lớp</label>
            <select className="form-input-navy" value={filter.grade} onChange={e => setFilter(f => ({ ...f, grade: e.target.value }))}>
              <option value="">Tất cả khối</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>
          <div className="qb-filter-item">
            <label className="form-label-navy">Chương</label>
            <select className="form-input-navy" value={filter.chapter} onChange={e => setFilter(f => ({ ...f, chapter: e.target.value }))}>
              <option value="">Tất cả chương</option>
              {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>Chương {i + 1}</option>)}
            </select>
          </div>
          <div className="qb-filter-item">
            <label className="form-label-navy">Loại kiến thức</label>
            <select className="form-input-navy" value={filter.knowledge_type} onChange={e => setFilter(f => ({ ...f, knowledge_type: e.target.value }))}>
              <option value="">Tất cả loại</option>
              {ktOptions.map(kt => <option key={kt.id} value={kt.name}>{kt.name}</option>)}
            </select>
          </div>
          <div className="qb-filter-item">
            <label className="form-label-navy">Độ khó</label>
            <select className="form-input-navy" value={filter.difficulty} onChange={e => setFilter(f => ({ ...f, difficulty: e.target.value }))}>
              <option value="">Tất cả độ khó</option>
              {Object.entries(DIFF_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Question list Table */}
        <div className="qb-table-card">
          {loading ? (
            <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="qb-table-wrap">
              <table className="qb-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
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
                  {currentQuestions.map((q, index) => (
                    <tr key={q.id}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-gray)' }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td><div className="qb-question-text">{q.content}</div></td>
                      <td><span className="qb-badge qb-badge-grade">Khối {q.grade || 10}</span></td>
                      <td><span className="qb-badge qb-badge-chapter">Ch. {q.chapter}</span></td>
                      <td><span className="qb-badge qb-badge-kt">{q.knowledge_type}</span></td>
                      <td>
                        <span className={`score-badge ${q.difficulty === 1 ? 'score-good' : q.difficulty === 2 ? 'score-avg' : 'score-bad'}`}>
                          {DIFF_LABELS[q.difficulty]}
                        </span>
                      </td>
                      <td><span style={{ fontWeight: 800, color: '#10b981' }}>{q.correct_answer}</span></td>
                      <td>
                        <div className="exam-actions">
                          <button className="action-btn btn-edit" onClick={() => openEdit(q)} title="Sửa">✏️</button>
                          <button className="action-btn btn-delete" onClick={() => handleDelete(q.id)} title="Xóa">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {questions.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-gray)' }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                        Không tìm thấy câu hỏi nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* === THANH PHÂN TRANG (Cập nhật thêm nút Trang đầu / Trang cuối) === */}
              {totalPages > 1 && (
                <div className="qb-pagination">
                  <button 
                    className="qb-page-btn" 
                    title="Về trang đầu"
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(1)}
                  >
                    &laquo;&laquo;
                  </button>
                  <button 
                    className="qb-page-btn" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    &laquo; Trước
                  </button>
                  
                  <span className="qb-page-info">
                    Trang {currentPage} / {totalPages}
                  </span>
                  
                  <button 
                    className="qb-page-btn" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Sau &raquo;
                  </button>
                  <button 
                    className="qb-page-btn" 
                    title="Đến trang cuối"
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    &raquo;&raquo;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ================= FORM MODAL (THÊM/SỬA) ================= */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box-md">
            
            <div className="modal-header">
              <h3 className="modal-title">{editId ? '✏️ Sửa câu hỏi' : '✨ Thêm câu hỏi mới'}</h3>
              <button className="modal-close modal-close-bg" onClick={() => setShowForm(false)}>✖</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label-navy">Nội dung câu hỏi <span style={{color: 'var(--jasper)'}}>*</span></label>
                <textarea className="qb-form-textarea" rows={3} value={form.content} onChange={e => set('content', e.target.value)} required placeholder="Nhập câu hỏi tại đây..." />
              </div>
              
              <div className="qb-form-grid">
                {['a', 'b', 'c', 'd'].map(l => (
                  <div key={l} className="form-group" style={{ margin: 0 }}>
                    <label className="form-label-navy">Đáp án {l.toUpperCase()} <span style={{color: 'var(--jasper)'}}>*</span></label>
                    <input className="form-input-navy" value={(form as any)[`option_${l}`]} onChange={e => set(`option_${l}`, e.target.value)} required />
                  </div>
                ))}
              </div>

              <div className="qb-form-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label-navy">Đáp án đúng <span style={{color: 'var(--jasper)'}}>*</span></label>
                  <select className="form-input-navy" value={form.correct_answer} onChange={e => set('correct_answer', e.target.value)}>
                    {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>Đáp án {l}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label-navy">Loại kiến thức <span style={{color: 'var(--jasper)'}}>*</span></label>
                  <select className="form-input-navy" value={form.knowledge_type} onChange={e => set('knowledge_type', e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {ktOptions.map(kt => <option key={kt.id} value={kt.name}>{kt.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label-navy">Khối lớp <span style={{color: 'var(--jasper)'}}>*</span></label>
                  <select className="form-input-navy" value={form.grade} onChange={e => set('grade', Number(e.target.value))}>
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label-navy">Độ khó</label>
                  <select className="form-input-navy" value={form.difficulty} onChange={e => set('difficulty', Number(e.target.value))}>
                    {Object.entries(DIFF_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="qb-form-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label-navy">Chương</label>
                  <input className="form-input-navy" type="number" min={1} value={form.chapter} onChange={e => set('chapter', Number(e.target.value))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label-navy">Tên chương (Không bắt buộc)</label>
                  <input className="form-input-navy" value={form.chapter_name} onChange={e => set('chapter_name', e.target.value)} placeholder="VD: Mệnh đề - Tập hợp" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label-navy">Giải thích đáp án</label>
                <textarea className="qb-form-textarea" rows={2} value={form.explanation} onChange={e => set('explanation', e.target.value)} placeholder="Nhập lời giải chi tiết (nếu có)..." />
              </div>
              
              <button type="submit" className="btn-submit-navy" style={{ marginTop: '0.5rem' }}>
                {editId ? '💾 Cập nhật thay đổi' : '✨ Lưu câu hỏi mới'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}