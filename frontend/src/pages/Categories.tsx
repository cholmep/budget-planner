import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  sortOrder: number;
}

interface CategoryForm {
  name: string;
  type: 'income' | 'expense';
  sortOrder: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    type: 'expense',
    sortOrder: 0
  });

  // Initialize categories if they don't exist
  const initializeCategories = async () => {
    try {
      const { data } = await axios.post('/api/categories/initialize');
      setCategories(data);
    } catch (err: any) {
      if (err.response?.status === 400) {
        // Categories already exist, just fetch them
        await fetchCategories();
      } else {
        setError(err.response?.data?.message || 'Failed to initialize categories');
      }
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/categories');
      if (data.length === 0) {
        // If no categories exist, initialize them
        await initializeCategories();
      } else {
        setCategories(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    try {
      await axios.post('/api/categories', formData);
      await fetchCategories();
      setShowAddForm(false);
      setFormData({ name: '', type: 'expense', sortOrder: 0 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await axios.put(`/api/categories/${id}`, formData);
      await fetchCategories();
      setEditingCategory(null);
      setFormData({ name: '', type: 'expense', sortOrder: 0 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await axios.delete(`/api/categories/${id}`);
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category._id);
    setFormData({
      name: category.name,
      type: category.type,
      sortOrder: category.sortOrder
    });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: '', type: 'expense', sortOrder: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const CategoryForm = ({ onSubmit, onCancel }: { onSubmit: () => void, onCancel: () => void }) => (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
      <select
        className="input w-32"
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
      >
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <input
        type="text"
        className="input flex-1"
        placeholder="Category name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="number"
        className="input w-24"
        placeholder="Order"
        value={formData.sortOrder}
        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
      />
      <button onClick={onSubmit} className="btn btn-primary p-2">
        <Save className="h-4 w-4" />
      </button>
      <button onClick={onCancel} className="btn btn-ghost p-2">
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  const CategoryItem = ({ category }: { category: Category }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div className="flex items-center space-x-3">
        <span className={`px-2 py-1 rounded text-sm ${
          category.type === 'income' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
        }`}>
          {category.type}
        </span>
        <span className="font-medium">{category.name}</span>
        {category.isDefault && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">Default</span>
        )}
      </div>
      {!category.isDefault && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => startEdit(category)}
            className="p-2 text-gray-400 hover:text-primary-600"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(category._id)}
            className="p-2 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showAddForm && (
        <CategoryForm
          onSubmit={handleAdd}
          onCancel={() => {
            setShowAddForm(false);
            setFormData({ name: '', type: 'expense', sortOrder: 0 });
          }}
        />
      )}

      <div className="space-y-6">
        {/* Income Categories */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Income Categories</h2>
          <div className="space-y-3">
            {incomeCategories.map(category => (
              <div key={category._id}>
                {editingCategory === category._id ? (
                  <CategoryForm
                    onSubmit={() => handleUpdate(category._id)}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <CategoryItem category={category} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Expense Categories</h2>
          <div className="space-y-3">
            {expenseCategories.map(category => (
              <div key={category._id}>
                {editingCategory === category._id ? (
                  <CategoryForm
                    onSubmit={() => handleUpdate(category._id)}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <CategoryItem category={category} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories; 