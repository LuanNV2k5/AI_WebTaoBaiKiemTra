import React, { useEffect, useState } from 'react';
import { knowledgeTypesApi } from '../services/api';
import '../index.css'; // Đảm bảo import CSS

interface KnowledgeType {
  id: number;
  name: string;
}

export default function KnowledgeTypesPage() {
  const [types, setTypes] = useState<KnowledgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadTypes = () => {
    setLoading(true);
    knowledgeTypesApi.list()
      .then(r => setTypes(r.data))
      .catch(err => alert('Lỗi khi tải danh sách: ' + (err.response?.data?.detail || err.message)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editingId) {
        await knowledgeTypesApi.update(editingId, name);
      } else {
        await knowledgeTypesApi.create(name);
      }
      setName('');
      setEditingId(null);
      loadTypes();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi lưu');
    }
  };

  const handleEdit = (t: KnowledgeType) => {
    setName(t.name);
    setEditingId(t.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa loại kiến thức này?')) return;
    try {
      await knowledgeTypesApi.delete(id);
      loadTypes();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi xóa');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-gray)', marginTop: '1rem' }}>Đang tải dữ liệu...</p>
    </div>
  );

  return (
    <div className="kt-container">
      <h1 className="kt-title">🏷️ Quản lý loại kiến thức</h1>

      <div className="kt-layout-grid">
        
        {/* ================= CỘT TRÁI: FORM ================= */}
        <div className="kt-left-col">
          <div className="kt-card">
            <h3 className="kt-card-title">
              {editingId ? '✏️ Sửa loại kiến thức' : '✨ Thêm loại kiến thức mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label-navy">Tên loại kiến thức <span style={{color: 'var(--jasper)'}}>*</span></label>
                <input 
                  className="form-input-navy" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="VD: Định lý Vi-ét..."
                  required
                />
              </div>
              
              <div className="kt-form-actions">
                {editingId && (
                  <button type="button" className="btn-cancel-gray" onClick={() => { setEditingId(null); setName(''); }}>
                    Hủy bỏ
                  </button>
                )}
                <button type="submit" className="btn-submit-navy" style={{ margin: 0, flex: 2 }}>
                  {editingId ? '💾 Lưu thay đổi' : '🚀 Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ================= CỘT PHẢI: DANH SÁCH ================= */}
        <div className="kt-right-col">
          <div className="kt-card">
            <h3 className="kt-card-title">📚 Danh sách hiện có ({types.length})</h3>
            
            <div className="kt-table-wrap">
              {types.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-gray)' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                  Chưa có loại kiến thức nào.
                </div>
              ) : (
                <table className="kt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                      <th>Tên loại kiến thức</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {types.map(t => (
                      <tr key={t.id}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-gray)' }}>
                          #{t.id}
                        </td>
                        <td>
                          <span className="kt-name-text">{t.name}</span>
                        </td>
                        <td>
                          <div className="flex-right">
                            <button className="action-btn btn-edit" onClick={() => handleEdit(t)} title="Sửa">✏️</button>
                            <button className="action-btn btn-delete" onClick={() => handleDelete(t.id)} title="Xóa">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}