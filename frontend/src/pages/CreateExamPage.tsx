import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsApi, questionsApi, knowledgeTypesApi } from '../services/api';
import '../index.css';

const CHAPTERS = Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Chương ${i + 1}` }));

export default function CreateExamPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'auto' | 'manual' | 'ai'>('auto');
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
    topic: '',
  });

  const loadQuestions = async () => {
    try {
      const res = await questionsApi.list({ grade: qSearch.grade, chapter: qSearch.chapter || undefined });
      setAvailableQuestions(res.data);
    } catch (err) { alert("Lỗi tải ngân hàng câu hỏi"); }
  };

  useEffect(() => {
    if (mode === 'manual') loadQuestions();
  }, [mode, qSearch]);

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
  }, [availableQuestions]);

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
      let res;
      if (mode === 'auto') {
        const payload = { ...form, chapters: form.chapters.length ? form.chapters : undefined, knowledge_types: form.knowledge_types.length ? form.knowledge_types : undefined };
        res = await examsApi.generate(payload);
      } else if (mode === 'ai') {
        if (!form.topic.trim()) { setLoading(false); return alert('Vui lòng nhập chủ đề AI cần soạn'); }
        const payload = {
          title: form.title,
          topic: form.topic,
          subject: form.subject,
          grade: form.grade,
          total_questions: form.total_questions,
          difficulty_distribution: form.difficulty_distribution,
          time_limit: form.time_limit,
          chapter: form.chapters[0] || 1,
          knowledge_type: form.knowledge_types[0] || 'concept'
        };
        res = await examsApi.generateAI(payload);
      } else {
        if (selectedQuestionIds.length === 0) { setLoading(false); return alert("Vui lòng chọn ít nhất 1 câu hỏi"); }
        res = await examsApi.createManual({
          title: form.title,
          grade: form.grade,
          time_limit: form.time_limit,
          question_ids: selectedQuestionIds
        });
      }
      
      setLoading(false);
      alert(mode === 'manual' ? '✅ Đã tạo đề thi thủ công thành công!' : `✅ Tạo đề thành công: ${res.data.total_questions} câu hỏi!`);
      navigate('/exams');
    } catch (err: any) {
      setLoading(false);
      console.error("Lỗi tạo đề:", err);
      let msg = 'Tạo đề thất bại';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Hệ thống AI phản hồi quá lâu (Timeout). Bạn hãy thử lại với số lượng câu hỏi ít hơn (ví dụ: 10 câu) hoặc kiểm tra lại kết nối mạng.';
      } else if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.message) {
        msg = `Lỗi: ${err.message}`;
      }
      alert(msg);
    }
  };

  const toggleQuestion = (id: number) => {
    setSelectedQuestionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalDiff = form.difficulty_distribution.easy + form.difficulty_distribution.medium + form.difficulty_distribution.hard;

  return (
    <div className="ce-container">
      
      {/* Header & Mode Switcher */}
      <div className="ce-header-section">
        <div>
          <h1 className="ce-title">
            {mode === 'auto' ? 'Tạo đề tự động' : mode === 'ai' ? 'Tạo đề bằng AI' : 'Tạo đề thủ công'}
          </h1>
        </div>
        
        <div className="ce-mode-switcher">
          <button 
            type="button" 
            onClick={() => setMode('auto')} 
            className={`ce-mode-btn ${mode === 'auto' ? 'active' : ''}`}
          >
            Chế độ Tự động
          </button>
          <button 
            type="button" 
            onClick={() => setMode('ai')} 
            className={`ce-mode-btn ${mode === 'ai' ? 'active' : ''}`}
            style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}
          >
            AI Soạn Đề
          </button>
          <button 
            type="button" 
            onClick={() => setMode('manual')} 
            className={`ce-mode-btn ${mode === 'manual' ? 'active' : ''}`}
          >
            Chế độ Thủ công
          </button>
        </div>
      </div>

      <form onSubmit={handleGenerate}>
        <div className="ce-layout-grid">
          
          {/* ================= CỘT TRÁI ================= */}
          <div className="ce-left-column">
            
            {/* Basic info Card */}
            <div className="ce-card">
              <h3 className="ce-card-title">
                <span className="ce-icon-primary">⚙️</span> Thông tin cơ bản
              </h3>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label-navy">Tên đề thi <span className="ce-required-star">*</span></label>
                <input className="form-input-navy" placeholder="VD: Kiểm tra 15 phút Đại số Chương 1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              
              <div className="ce-grid-inputs">
                <div>
                  <label className="form-label-navy">Khối lớp</label>
                  <select className="form-input-navy" value={form.grade} onChange={e => {
                    const g = Number(e.target.value);
                    setForm(f => ({ ...f, grade: g }));
                    setQSearch(qs => ({ ...qs, grade: g }));
                  }}>
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
                {(mode === 'auto' || mode === 'ai') && (
                  <div>
                    <label className="form-label-navy">Số lượng câu hỏi</label>
                    <input className="form-input-navy" type="number" min={5} max={60} value={form.total_questions} onChange={e => setForm(f => ({ ...f, total_questions: Number(e.target.value) }))} />
                  </div>
                )}
                <div>
                  <label className="form-label-navy">Thời gian (phút)</label>
                  <input className="form-input-navy" type="number" min={5} max={180} value={form.time_limit} onChange={e => setForm(f => ({ ...f, time_limit: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            {mode === 'auto' ? (
              <>
                {/* Chapters Card */}
                <div className="ce-card">
                  <h3 className="ce-card-title-sm">📚 Giới hạn Chương (Bỏ trống = Lấy tất cả)</h3>
                  <div className="ce-toggle-group">
                    {CHAPTERS.map(ch => (
                      <button type="button" key={ch.value} onClick={() => toggleChapter(ch.value)} className={`ce-toggle-btn ${form.chapters.includes(ch.value) ? 'active' : ''}`}>
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Knowledge types Card */}
                <div className="ce-card">
                  <h3 className="ce-card-title-sm">🧠 Loại kiến thức (Bỏ trống = Lấy tất cả)</h3>
                  <div className="ce-toggle-group">
                    {ktOptions.map(kt => (
                      <button type="button" key={kt.id} onClick={() => toggleKT(kt.name)} className={`ce-toggle-btn ${form.knowledge_types.includes(kt.name) ? 'active' : ''}`}>
                        {kt.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : mode === 'ai' ? (
              <div className="ce-card">
                <h3 className="ce-card-title">
                  <span className="ce-icon-primary">🚀</span> Chủ đề AI cần soạn
                </h3>
                <div className="form-group">
                  <label className="form-label-navy">Mô tả chủ đề hoặc nội dung kiến thức</label>
                  <textarea 
                    className="form-input-navy" 
                    rows={4}
                    placeholder="VD: Các bài toán về căn bậc hai lớp 10, tập trung vào hằng đẳng thức căn A bình bằng trị tuyệt đối của A..." 
                    value={form.topic} 
                    onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                    * AI sẽ tự động tạo câu hỏi, đáp án và lời giải chi tiết dựa trên yêu cầu của bạn.
                  </p>
                </div>
              </div>
            ) : (
              /* Manual Mode: Question Bank Card */
              <div className="ce-card">
                <div className="ce-bank-header">
                  <h3 className="ce-bank-title">
                    🏦 Ngân hàng câu hỏi <span className="ce-bank-count">(Đã chọn: {selectedQuestionIds.length})</span>
                  </h3>
                  <select className="form-input-navy ce-filter-select" value={qSearch.chapter || ''} onChange={e => setQSearch({...qSearch, chapter: e.target.value ? Number(e.target.value) : null})}>
                    <option value="">Lọc: Tất cả chương</option>
                    <option value={1}>Chương 1</option>
                    <option value={2}>Chương 2</option>
                    <option value={3}>Chương 3</option>
                    <option value={4}>Chương 4</option>
                    <option value={5}>Chương 5</option>
                    <option value={6}>Chương 6</option>
                    <option value={7}>Chương 7</option>
                    <option value={8}>Chương 8</option>
                  </select>
                </div>
                
                <div className="ce-table-container">
                  {availableQuestions.length === 0 ? (
                    <div className="ce-empty-state">
                      <span className="ce-empty-icon">🔍</span>
                      Không tìm thấy câu hỏi phù hợp.
                    </div>
                  ) : (
                    <table className="ce-table">
                      <thead>
                        <tr>
                          <th className="ce-col-check">Chọn</th>
                          <th className="ce-col-stt">STT</th>
                          <th>Nội dung câu hỏi</th>
                          <th className="ce-col-diff">Độ khó</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableQuestions.map((q, index) => (
                          <tr key={q.id} className={selectedQuestionIds.includes(q.id) ? 'selected' : ''} onClick={() => toggleQuestion(q.id)}>
                            <td className="ce-cell-center">
                              <input type="checkbox" checked={selectedQuestionIds.includes(q.id)} readOnly className="ce-checkbox-custom" />
                            </td>
                            <td className="ce-cell-center" style={{ fontWeight: 'bold', color: 'var(--text-gray)' }}>
                              {index + 1}
                            </td>
                            <td>
                              <div className="ce-table-content">
                                {q.content}
                              </div>
                            </td>
                            <td className="ce-cell-center">
                              <span className={`score-badge ${q.difficulty === 1 ? 'score-good' : q.difficulty === 2 ? 'score-avg' : 'score-bad'}`}>
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
          </div>

          {/* ================= CỘT PHẢI (STICKY) ================= */}
          <div className="ce-sticky-sidebar">
            
            {(mode === 'auto' || mode === 'ai') && (
              <div className="ce-card">
                <div className="ce-diff-header">
                  <h3 className="ce-card-title-sm ce-title-nomargin">🎯 Phân bổ độ khó</h3>
                  <span className={`ce-diff-badge ${totalDiff === 100 ? 'valid' : 'invalid'}`}>
                    Tổng: {totalDiff}%
                  </span>
                </div>
                
                {totalDiff !== 100 && (
                  <div className="ce-warning-alert">
                    ⚠️ Tổng phải tròn 100%. Vui lòng kéo lại thanh trượt.
                  </div>
                )}
                
                {[['easy', 'Dễ', '#10b981'], ['medium', 'Trung bình', '#f59e0b'], ['hard', 'Khó', 'var(--jasper)']].map(([k, label, color]) => (
                  <div key={k} className="ce-slider-group">
                    <div className="ce-slider-header">
                      <label className="ce-slider-label">{label}</label>
                      <strong style={{ color: color as string }}>{form.difficulty_distribution[k as keyof typeof form.difficulty_distribution]}%</strong>
                    </div>
                    <input 
                      type="range" min={0} max={100} 
                      value={form.difficulty_distribution[k as keyof typeof form.difficulty_distribution]}
                      onChange={e => setDiff(k, Number(e.target.value))}
                      className="ce-slider-input"
                      style={{ accentColor: color as string }} 
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Bảng tóm tắt & Nút Submit */}
            <div className="ce-card ce-summary-card">
               <h3 className="ce-card-title-sm ce-summary-header">
                 Tóm tắt thao tác
               </h3>
               <div className="ce-summary-content">
                 {mode === 'auto' ? (
                   <ul className="ce-summary-list">
                     <li>Sử dụng AI Tự động</li>
                     <li>Tổng số: <strong>{form.total_questions}</strong> câu</li>
                     <li>Thời gian: <strong>{form.time_limit}</strong> phút</li>
                   </ul>
                 ) : mode === 'ai' ? (
                  <ul className="ce-summary-list">
                    <li>AI Soạn Đề Mới</li>
                    <li>Tổng số: <strong>{form.total_questions}</strong> câu</li>
                    <li>Thời gian: <strong>{form.time_limit}</strong> phút</li>
                  </ul>
                 ) : (
                   <ul className="ce-summary-list">
                     <li>Chọn thủ công</li>
                     <li>Đã chọn: <strong style={{ color: selectedQuestionIds.length > 0 ? 'var(--cerulean)' : 'inherit'}}>{selectedQuestionIds.length}</strong> câu</li>
                     <li>Thời gian: <strong>{form.time_limit}</strong> phút</li>
                   </ul>
                 )}
               </div>

              <button 
                type="submit" 
                disabled={loading || (mode === 'auto' && totalDiff !== 100) || (mode === 'manual' && selectedQuestionIds.length === 0)}
                className="ce-submit-btn"
              >
                {loading ? 'Đang xử lý...' : mode === 'auto' ? 'XÁC NHẬN TẠO ĐỀ' : mode === 'ai' ? 'AI BẮT ĐẦU SOẠN ĐỀ' : 'LƯU ĐỀ THỦ CÔNG'}
              </button>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}