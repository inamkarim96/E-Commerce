import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button, Modal, Input } from '../components/ui';

import * as productsApi from '../api/products';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  name: ''
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getCategories();
      if (res.success) {
        setCategories(res.data?.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      if (!formData.name.trim()) {
        toast.error('Category name is required');
        return;
      }

      const payload = {
        name: formData.name.trim()
      };

      let res;
      if (editingCategory) {
        res = await productsApi.updateCategory(editingCategory.id, payload);
        toast.success('Category updated successfully');
      } else {
        res = await productsApi.createCategory(payload);
        toast.success('Category created successfully');
      }

      if (res.success) {
        handleCloseModal();
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to save category:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    try {
      const res = await productsApi.deleteCategory(categoryId);
      if (res.success) {
        toast.success('Category deleted successfully');
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to delete category');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-management">
      <div className="page-header">
        <div>
          <h1>Category Management</h1>
          <p>Manage product categories. Categories with linked products cannot be deleted.</p>
        </div>
        <Button 
          variant="admin-primary" 
          icon={Plus} 
          onClick={openAddModal}
        >
          Add New Category
        </Button>
      </div>

      <div className="toolbar">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          containerClassName="mb-0 flex-1"
        />
        <div className="toolbar-actions">
          <span className="results-count">
            {filteredCategories.length} categories
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading categories...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    {searchTerm ? 'No categories match your search' : 'No categories found. Create your first category to get started.'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="name-cell">{cat.name}</td>
                    <td className="slug-cell">{cat.slug}</td>
                    <td className="count-cell">{cat.product_count || 0}</td>
                    <td className="date-cell">
                      {new Date(cat.created_at).toLocaleDateString()}
                    </td>
                    <td className="actions-cell">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="admin-ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => openEditModal(cat)}
                          title="Edit category"
                        />
                        <Button
                          variant="admin-danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleteConfirm(cat)}
                          title="Delete category"
                          disabled={cat.product_count > 0}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={handleCloseModal}>Cancel</Button>
            <Button 
              variant="admin-primary" 
              onClick={handleSave} 
              loading={saving}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Dried Fruits"
            required
            autoFocus
          />
          
          {editingCategory && (
            <Input
              label="Slug (Read-only)"
              value={editingCategory.slug}
              disabled
              className="bg-slate-50"
            />
          )}
          <p className="text-xs text-slate-500">
            Slug is auto-generated from the name and used in URLs.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="admin-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete Category</Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={24} />
          <div>
            <p className="text-slate-700">Are you sure you want to delete the category <strong>"{deleteConfirm?.name}"</strong>?</p>
            <p className="text-sm text-red-600 mt-2">This action cannot be undone. Products linked to this category will lose their assignment.</p>
          </div>
        </div>
      </Modal>

      
    </div>
  );
};

export default AdminCategories;
