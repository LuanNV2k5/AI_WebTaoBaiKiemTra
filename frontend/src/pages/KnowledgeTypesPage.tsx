import React, { useEffect, useState } from 'react';
import { knowledgeTypesApi } from '../services/api';

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

  if (loading) return <div className="loading-center"><div className="spinner"/><p className="text-secondary">Đang tải...</p></div>;

  return (
    <div className="page fade-in">
      <h1 style={{ marginBottom: '1.5rem' }}>🏷️ Quản lý loại kiến thức</h1>

      <div className="grid-2">
        {/* Form */}
        <div className="card">
          <h3>{editingId ? 'Sửa loại kiến thức' : 'Thêm loại kiến thức mới'}</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tên loại kiến thức</label>
              <input 
                className="form-input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="VD: Công thức lượng giác..."
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setName(''); }}>
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="card">
          <h3>Danh sách hiện có</h3>
          <div style={{ marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => (
                  <tr key={t.id}>
                    <td><span style={{ fontWeight: 600 }}>{t.name}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-warning" onClick={() => handleEdit(t)}>[Sửa]</button>
                      {' '}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>[Xóa]</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
